import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

type Tier = "school" | "university";

/** Runs Google Cloud Vision text detection on an image URL. */
async function ocrImageUrl(url: string): Promise<string> {
  try {
    const { ImageAnnotatorClient } = await import("@google-cloud/vision");
    const client = new ImageAnnotatorClient();
    const [result] = await client.textDetection(url);
    return (result.fullTextAnnotation?.text || "").trim();
  } catch (e) {
    logger.warn("studentVerification OCR failed:", (e as Error)?.message ?? e);
    return "";
  }
}

/**
 * Student submits tiered tuition verification; OCR runs on image URLs; status → pending_review.
 */
export const submitStudentVerification = onCall(
  { cors: true, memory: "512MiB", timeoutSeconds: 120 },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in to submit verification.");
    }

    const uid = request.auth.uid;
    const userSnap = await getFirestore().collection("users").doc(uid).get();
    if (userSnap.data()?.studentVerificationStatus === "pending_review") {
      throw new HttpsError(
        "failed-precondition",
        "Your verification is already under review. Wait for an admin decision before submitting again."
      );
    }

    const tier = String(request.data?.tier || "").toLowerCase() as Tier;
    const documentUrls = Array.isArray(request.data?.documentUrls) ?
      (request.data.documentUrls as unknown[]).filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u)) :
      [];
    const guardianEmail = String(request.data?.guardianEmail || "").trim();
    const guardianPhone = String(request.data?.guardianPhone || "").trim();
    const institutionalEmail = String(request.data?.institutionalEmail || "").trim();

    if (tier !== "school" && tier !== "university") {
      throw new HttpsError("invalid-argument", "Select School (Grades 8–12) or University.");
    }

    if (tier === "school") {
      if (!guardianEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)) {
        throw new HttpsError("invalid-argument", "Enter a valid parent/guardian email.");
      }
      if (documentUrls.length < 1) {
        throw new HttpsError(
          "invalid-argument",
          "Upload at least one document (fee voucher, exam slip, or school ID)."
        );
      }
    } else {
      if (!institutionalEmail && documentUrls.length < 1) {
        throw new HttpsError(
          "invalid-argument",
          "Enter your university email or upload student ID / transcript."
        );
      }
      if (institutionalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(institutionalEmail)) {
        throw new HttpsError("invalid-argument", "Enter a valid university email.");
      }
    }

    if (documentUrls.length > 5) {
      throw new HttpsError("invalid-argument", "Too many files (max 5).");
    }

    const ocrParts: string[] = [];
    for (const url of documentUrls) {
      if (/\.pdf(\?|$)/i.test(url)) {
        ocrParts.push("[PDF: text extraction skipped; admin will review manually]");
      } else {
        const text = await ocrImageUrl(url);
        if (text) ocrParts.push(text.slice(0, 3500));
      }
    }
    const ocrExcerpt = ocrParts.join("\n---\n").slice(0, 8000);

    const db = getFirestore();
    await db.collection("users").doc(uid).set(
      {
        studentVerificationTier: tier,
        studentVerificationStatus: "pending_review",
        studentVerificationSubmittedAt: FieldValue.serverTimestamp(),
        studentVerificationDocUrls: documentUrls,
        studentVerificationOcrExcerpt: ocrExcerpt || "(no text extracted)",
        guardianEmail: tier === "school" ? guardianEmail : null,
        guardianPhone: tier === "school" ? guardianPhone || null : null,
        institutionalEmail: tier === "university" ? institutionalEmail || null : null,
        studentVerificationRejectionReason: null,
        studentVerificationReviewNote: null,
      },
      { merge: true }
    );

    return {
      ok: true,
      status: "pending_review",
      message: "Submitted. An admin will review your documents. You can browse tutors meanwhile.",
    };
  }
);

/** Throws unless the user has admin role. */
async function assertAdmin(uid: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("users").doc(uid).get();
  if (snap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Admin only.");
  }
}

/**
 * Admin approves or rejects student tuition verification.
 */
export const reviewStudentVerification = onCall({ cors: true }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in as admin.");
  }
  await assertAdmin(request.auth.uid);

  const targetUserId = String(request.data?.userId || "").trim();
  const approved = Boolean(request.data?.approved);
  const note = String(request.data?.note || "").trim().slice(0, 500);

  if (!targetUserId) {
    throw new HttpsError("invalid-argument", "userId required.");
  }

  const db = getFirestore();
  const ref = db.collection("users").doc(targetUserId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }

  await ref.update({
    studentVerificationStatus: approved ? "verified" : "rejected",
    studentVerificationReviewedAt: FieldValue.serverTimestamp(),
    studentVerificationReviewNote: note || (approved ? "Approved" : "Rejected"),
    ...(approved ? {} : { studentVerificationRejectionReason: note || "Rejected by admin" }),
  });

  return { ok: true };
});
