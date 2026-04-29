import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

interface ChatPayload {
    action: 'create' | 'edit' | 'delete' | 'react';
    communityId: string;
    messageId?: string; // For edit/delete/react
    content?: string;
    encryptions?: Record<string, { ciphertext: string; iv: string }>;
    images?: string[];
    replyTo?: { id: string; senderName: string };
    emoji?: string; // For react
}

/**
 * Phase 1: Data Integrity (Server-Side Proxy)
 * Transitions direct Group Chat client writes into synchronized backend triggers accurately.
 */
export const handleGroupChatMessage = onCall(
    { cors: true },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Auth identity required for orbital chatter.");
        }

        const uid = request.auth.uid;
        const { action, communityId, messageId, content, encryptions, images, replyTo, emoji } = request.data as ChatPayload;

        if (!communityId) {
            throw new HttpsError("invalid-argument", "Target communityId origin required.");
        }

        try {
            // 1. Membership: members/{uid} subdoc OR parent members[] (string or {id}) OR community admin
            const memberDoc = await db.collection("communities").doc(communityId).collection("members").doc(uid).get();
            let isMember = memberDoc.exists;

            if (!isMember) {
                const commSnap = await db.collection("communities").doc(communityId).get();
                if (commSnap.exists) {
                    const commData = commSnap.data();
                    if (commData?.adminId === uid) {
                        isMember = true;
                    } else {
                        const membersArray = commData?.members || [];
                        isMember = membersArray.some((m: unknown) =>
                            typeof m === "string" ? m === uid : (m as { id?: string })?.id === uid
                        );
                    }
                }
            }

            if (!isMember) {
                throw new HttpsError("permission-denied", "You are not a member of this community orbit.");
            }

            // Fetch User Details for sender headers
            const userSnap = await db.collection("users").doc(uid).get();
            const userData = userSnap.data() || {};
            const senderName = userData.name || userData.displayName || "Anonymous";
            const senderAvatar = userData.photoURL || userData.avatar || "";

            const messagesRef = db.collection("communities").doc(communityId).collection("messages");

            if (action === 'create') {
                const payload: any = {
                    senderId: uid,
                    senderName,
                    senderAvatar,
                    timestamp: FieldValue.serverTimestamp(),
                };

                // E2EE: never persist plaintext when ciphertext map is present (defense in depth).
                if (encryptions && Object.keys(encryptions).length > 0) {
                    payload.encryptions = encryptions;
                } else if (content && content.trim()) {
                    payload.content = content.trim();
                }
                if (images && images.length > 0) payload.images = images;
                if (replyTo && replyTo.id) payload.replyTo = replyTo;

                const docRef = await messagesRef.add(payload);
                return { success: true, id: docRef.id };
            } else if (action === 'edit') {
                if (!messageId) throw new HttpsError("invalid-argument", "Missing messageId for edit trigger.");

                const messageRef = messagesRef.doc(messageId);
                const messageSnap = await messageRef.get();
                if (!messageSnap.exists) throw new HttpsError("not-found", "Message extinct.");
                if (messageSnap.data()?.senderId !== uid) throw new HttpsError("permission-denied", "Locked to original uploader origin.");

                const updatePayload: any = {
                    edited: true,
                    updatedAt: FieldValue.serverTimestamp(),
                };

                if (encryptions && Object.keys(encryptions).length > 0) {
                    updatePayload.encryptions = encryptions;
                    updatePayload.content = FieldValue.delete();
                } else if (content && content.trim()) {
                    updatePayload.content = content.trim();
                }

                await messageRef.update(updatePayload);
                return { success: true };
            } else if (action === 'delete') {
                if (!messageId) throw new HttpsError("invalid-argument", "Missing messageId for delete trigger.");

                const messageRef = messagesRef.doc(messageId);
                const messageSnap = await messageRef.get();
                if (!messageSnap.exists) throw new HttpsError("not-found", "Message extinct.");

                // Allow owner or Admin to delete. Assuming admin logic can check another doc, full owner check here.
                if (messageSnap.data()?.senderId !== uid) {
                     throw new HttpsError("permission-denied", "Locked to original uploader securely.");
                }

                await messageRef.delete();
                return { success: true };
            } else if (action === 'react') {
                if (!messageId || !emoji) throw new HttpsError("invalid-argument", "Missing messageId or emoji for reaction.");

                const reactRef = messagesRef.doc(messageId).collection("reactions").doc(uid);
                const prev = await reactRef.get();
                if (prev.exists && prev.data()?.emoji === emoji) {
                    await reactRef.delete();
                } else {
                    await reactRef.set({
                        emoji,
                        timestamp: FieldValue.serverTimestamp(),
                    });
                }
                return { success: true };
            }

            throw new HttpsError("invalid-argument", "Unsupported proxy action operation.");
        } catch (error: any) {
            // Re-throw HttpsErrors directly to preserve status code and message
            if (error instanceof HttpsError) {
                throw error;
            }
            logger.error("handleGroupChatMessage collapse:", error);
            throw new HttpsError("internal", error.message || "Operation failed inside atmospheric distortion.");
        }
    }
);
