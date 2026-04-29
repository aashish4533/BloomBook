import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Revokes student tuition verification and tutor platform verification for both parties.
 * @param {string} studentId - Firestore users/{studentId} for the student.
 * @param {string} tutorId - Firestore tutors/{tutorId} for the tutor.
 * @param {string} reason - Reason stored on both profiles for the revoke.
 */
async function revokeBothVerifications(studentId: string, tutorId: string, reason: string): Promise<void> {
  const batch = db.batch();
  const userRef = db.collection("users").doc(studentId);
  const tutorRef = db.collection("tutors").doc(tutorId);
  batch.set(
    userRef,
    {
      studentVerificationStatus: "unverified",
      studentVerificationRevokedAt: FieldValue.serverTimestamp(),
      studentVerificationRevokeReason: reason,
    },
    { merge: true }
  );
  batch.set(
    tutorRef,
    {
      verificationStatus: "Revoked",
      verified: false,
      tuitionDealRevokedAt: FieldValue.serverTimestamp(),
      tuitionDealRevokeReason: reason,
    },
    { merge: true }
  );
  await batch.commit();
}

/** Clears assignment fields on a tuition request after a deal is revoked. */
async function resetTuitionRequestAfterRevoke(requestId: string): Promise<void> {
  await db.collection("tuition_requests").doc(requestId).update({
    orbit_status: "Open",
    assignedTutorId: FieldValue.delete(),
    assignedTutorName: FieldValue.delete(),
    status: FieldValue.delete(),
    tuitionAgreementDueAt: FieldValue.delete(),
    tuitionAgreementAccepted: false,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * When a request becomes Assigned, start the 2-day window to finalize a written agreement.
 */
export const onTuitionRequestAssignedAgreementTimer = onDocumentUpdated(
  "tuition_requests/{requestId}",
  async (event) => {
    const afterSnap = event.data?.after;
    const before = event.data?.before.data();
    const after = afterSnap?.data();
    if (!afterSnap || !after) return;
    const prev = before?.orbit_status;
    const next = after.orbit_status;
    if (next !== "Assigned" || prev === "Assigned") return;
    if (after.tuitionAgreementDueAt) return;
    const due = Timestamp.fromMillis(Date.now() + TWO_DAYS_MS);
    await afterSnap.ref.update({
      tuitionAgreementDueAt: due,
      tuitionAgreementAccepted: false,
    });
  }
);

/**
 * Callable: either party proposes the written deal; counterparty must accept within 2 days.
 */
export const proposeTuitionAgreement = onCall({ cors: true }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to propose an agreement.");
  }
  const uid = request.auth.uid;
  const chatId = String(request.data?.chatId || "").trim();
  const textRaw = String(request.data?.agreementText || "").trim();
  if (!chatId) {
    throw new HttpsError("invalid-argument", "chatId required.");
  }
  if (textRaw.length < 20 || textRaw.length > 8000) {
    throw new HttpsError("invalid-argument", "Agreement text must be between 20 and 8000 characters.");
  }

  const chatSnap = await db.collection("chats").doc(chatId).get();
  if (!chatSnap.exists) {
    throw new HttpsError("not-found", "Chat not found.");
  }
  const chat = chatSnap.data();
  if (!chat) {
    throw new HttpsError("not-found", "Chat not found.");
  }
  const participants: string[] = chat.participants || [];
  if (!participants.includes(uid)) {
    throw new HttpsError("permission-denied", "Not a participant in this chat.");
  }

  const studentId = chat.studentId as string | undefined;
  const tutorId = chat.tutorId as string | undefined;
  if (!studentId || !tutorId || !participants.includes(studentId) || !participants.includes(tutorId)) {
    throw new HttpsError("failed-precondition", "Tuition agreement is only for tuition chats.");
  }
  if (uid !== studentId && uid !== tutorId) {
    throw new HttpsError("permission-denied", "Only the student or tutor can propose.");
  }

  const userSnap = await db.collection("users").doc(studentId).get();
  if (userSnap.data()?.studentVerificationStatus !== "verified") {
    throw new HttpsError("failed-precondition", "Student must be verified to use tuition agreements.");
  }
  const tutorSnap = await db.collection("tutors").doc(tutorId).get();
  if (tutorSnap.data()?.verificationStatus !== "Verified") {
    throw new HttpsError("failed-precondition", "Tutor must be verified.");
  }

  const tuitionRequestId = (chat.tuitionRequestId as string) || null;
  if (tuitionRequestId) {
    const reqSnap = await db.collection("tuition_requests").doc(tuitionRequestId).get();
    const r = reqSnap.data();
    if (!r || r.orbit_status !== "Assigned" || r.studentId !== studentId || r.assignedTutorId !== tutorId) {
      throw new HttpsError("failed-precondition", "Tuition request is not in a valid assigned state.");
    }
    const dueAt = r.tuitionAgreementDueAt as Timestamp | undefined;
    if (dueAt && dueAt.toMillis() < Date.now()) {
      throw new HttpsError("deadline-exceeded", "Time to finalize this tuition match has expired.");
    }
  }

  const agrRef = db.collection("tuition_agreements").doc(chatId);
  const existing = (await agrRef.get()).data();
  if (existing?.status === "accepted") {
    throw new HttpsError("failed-precondition", "This deal is already accepted.");
  }
  if (existing?.status === "pending_acceptance") {
    throw new HttpsError("failed-precondition", "An agreement is already waiting for the other party to accept.");
  }

  const acceptDeadlineAt = Timestamp.fromMillis(Date.now() + TWO_DAYS_MS);
  await agrRef.set(
    {
      chatId,
      studentId,
      tutorId,
      tuitionRequestId,
      agreementText: textRaw,
      proposedBy: uid,
      status: "pending_acceptance",
      acceptDeadlineAt,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, status: "pending_acceptance" };
});

/**
 * Callable: the party who did not propose accepts the written deal.
 */
export const acceptTuitionAgreement = onCall({ cors: true }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in to accept.");
  }
  const uid = request.auth.uid;
  const chatId = String(request.data?.chatId || "").trim();
  if (!chatId) {
    throw new HttpsError("invalid-argument", "chatId required.");
  }

  const agrRef = db.collection("tuition_agreements").doc(chatId);
  const agrSnap = await agrRef.get();
  const agr = agrSnap.data();
  if (!agr || agr.status !== "pending_acceptance") {
    throw new HttpsError("failed-precondition", "No pending agreement to accept.");
  }
  const proposedBy = agr.proposedBy as string;
  if (proposedBy === uid) {
    throw new HttpsError("failed-precondition", "You cannot accept your own proposal.");
  }
  const studentId = agr.studentId as string;
  const tutorId = agr.tutorId as string;
  if (uid !== studentId && uid !== tutorId) {
    throw new HttpsError("permission-denied", "Not part of this agreement.");
  }

  const deadline = agr.acceptDeadlineAt as Timestamp;
  if (deadline.toMillis() < Date.now()) {
    throw new HttpsError("deadline-exceeded", "The acceptance deadline has passed.");
  }

  await agrRef.update({
    status: "accepted",
    acceptedBy: uid,
    acceptedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const tuitionRequestId = agr.tuitionRequestId as string | undefined;
  if (tuitionRequestId) {
    await db.collection("tuition_requests").doc(tuitionRequestId).update({
      tuitionAgreementAccepted: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return { ok: true, status: "accepted" };
});

/**
 * Periodically expire pending deals and assigned requests with no accepted agreement.
 */
export const expireTuitionAgreementsSchedule = onSchedule("every 6 hours", async () => {
  const now = Timestamp.now();
  const nowMs = Date.now();

  const pendingSnap = await db
    .collection("tuition_agreements")
    .where("status", "==", "pending_acceptance")
    .where("acceptDeadlineAt", "<=", now)
    .get();

  for (const docSnap of pendingSnap.docs) {
    const d = docSnap.data();
    const studentId = d.studentId as string;
    const tutorId = d.tutorId as string;
    const tuitionRequestId = d.tuitionRequestId as string | undefined;
    try {
      await revokeBothVerifications(
        studentId,
        tutorId,
        "Tuition agreement was not accepted within 2 days."
      );
      await docSnap.ref.update({
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (tuitionRequestId) {
        await resetTuitionRequestAfterRevoke(tuitionRequestId);
      }
    } catch (e) {
      logger.error(`expireTuitionAgreementsSchedule pending failed: ${(e as Error)?.message ?? e}`);
    }
  }

  const overdueReqSnap = await db
    .collection("tuition_requests")
    .where("orbit_status", "==", "Assigned")
    .where("tuitionAgreementDueAt", "<=", now)
    .get();

  for (const docSnap of overdueReqSnap.docs) {
    const r = docSnap.data();
    if (r.tuitionAgreementAccepted === true) continue;
    const studentId = r.studentId as string;
    const assignedTutorId = r.assignedTutorId as string;
    if (!studentId || !assignedTutorId) continue;
    const chatId = [studentId, assignedTutorId].sort().join("_");
    try {
      const agr = await db.collection("tuition_agreements").doc(chatId).get();
      if (agr.exists && agr.data()?.status === "accepted") {
        await docSnap.ref.update({
          tuitionAgreementAccepted: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
        continue;
      }
      await revokeBothVerifications(
        studentId,
        assignedTutorId,
        "No tuition agreement was accepted before the 2-day match deadline."
      );
      await resetTuitionRequestAfterRevoke(docSnap.id);
      if (agr.exists) {
        await agr.ref.set(
          {
            status: "expired",
            expiredAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      logger.error(`expireTuitionAgreementsSchedule overdue ${docSnap.id}: ${(e as Error)?.message ?? e}`);
    }
  }

  logger.info("expireTuitionAgreementsSchedule completed", { nowMs });
});
