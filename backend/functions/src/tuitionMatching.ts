import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Phase 2 & 3: Synchronization Engine (Matching Logic)
 * Triggered when a new tuition request is created.
 */
export const onTuitionRequestCreated = onDocumentCreated("tuition_requests/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const request = snapshot.data();
    const requestId = event.params.requestId;
    const subject = request.subject;

    if (!subject) {
        logger.warn("No subject found on request", requestId);
        return;
    }

    try {
        logger.info(`Scanning tutors for subject: ${subject} on Request: ${requestId}`);

        // 1. Query for Stabilized (Verified) tutors
        // Note: Querying by multiple fields will require a Composite Index!
        const tutorsSnapshot = await db.collection("tutors")
            .where("verificationStatus", "==", "Verified")
            .get();

        const matches: any[] = [];
        const notifiedTutors: string[] = [];

        tutorsSnapshot.forEach((doc) => {
            const tutor = doc.data();
            const tutorSubject = tutor.subject || "";

            // Simple match logic (case insensitive string match for now)
            if (tutorSubject.toLowerCase() === subject.toLowerCase()) {
                matches.push({
                    tutorId: doc.id,
                    name: tutor.name || "Anonymous",
                    avatar: tutor.avatar || "",
                    matchedAt: Timestamp.now(),
                });
                notifiedTutors.push(doc.id);
            }
        });

        if (matches.length === 0) {
            logger.info(`No matches found for request ${requestId}`);
            return;
        }

        logger.info(`Found ${matches.length} matching tutors for request ${requestId}`);

        // 2. Populate 'potential_matches' sub-collection
        const batch = db.batch();
        matches.forEach((match) => {
            const matchRef = db.collection("tuition_requests").doc(requestId).collection("potential_matches").doc(match.tutorId);
            batch.set(matchRef, match);

            // 3. Signal Flare: Create Notification for each tutor
            const notifRef = db.collection("notifications").doc();
            batch.set(notifRef, {
                userId: match.tutorId,
                type: "system", // Frontend can handle system type or custom 'tuition_match' icon mapping if extended
                title: "New Learning Orbit Available! 🛰️",
                message: `An orbital sync found a request in ${subject}. Review details.`,
                read: false,
                timestamp: Timestamp.now(),
                icon: "compass", // Maps to generic lookup
                link: `/tuition-hub`,
            });
        });

        // Track who we notified to prevent duplicates
        const requestRef = db.collection("tuition_requests").doc(requestId);
        batch.update(requestRef, {
            notified_tutors: notifiedTutors,
        });

        await batch.commit();
        logger.info(`Successfully synchronized ${matches.length} triggers for request ${requestId}`);
    } catch (error) {
        logger.error("Failed to execute sync matching on request creation", error);
    }
});
