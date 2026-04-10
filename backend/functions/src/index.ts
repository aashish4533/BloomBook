import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

/**
 * Returns 5 curated antigravity-themed book recommendations.
 * Acts as the "BookBloom AI Librarian" specialising in
 * speculative fiction and advanced physics.
 */
export const getAntigravityRecommendations = onCall(
    { cors: true }, // Allow all origins for production compatibility
    async () => {
        try {
            logger.info("getAntigravityRecommendations called");

            const recommendations = [
                {
                    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    title: "The Hunt for Zero Point",
                    author: "Nick Cook",
                    genre: "Speculative Non-Fiction",
                    summary:
                        "Aviation journalist Nick Cook investigates decades of classified " +
                        "research into antigravity propulsion. He traces the thread from " +
                        "WWII Nazi experiments to modern black-budget aerospace " +
                        "programmes, asking whether gravity control has already been " +
                        "achieved in secret.",
                    relevance:
                        "The definitive investigative deep-dive into real-world " +
                        "antigravity research and its hidden history.",
                    difficulty: "Intermediate",
                    bloom_score: 88,
                },
                {
                    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
                    title: "The Dispossessed",
                    author: "Ursula K. Le Guin",
                    genre: "Classic Sci-Fi",
                    summary:
                        "Physicist Shevek develops a General Temporal Theory that could " +
                        "unlock instantaneous communication—and, by extension, " +
                        "manipulation of space-time and gravity. The novel explores how " +
                        "such a breakthrough reshapes two opposing societies.",
                    relevance:
                        "Explores the social and political consequences of a physics " +
                        "breakthrough that could rewrite the rules of gravity and " +
                        "communication.",
                    difficulty: "Intermediate",
                    bloom_score: 95,
                },
                {
                    id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
                    title: "Eifelheim",
                    author: "Michael Flynn",
                    genre: "Hard Science Fiction",
                    summary:
                        "When an alien starship crash-lands in medieval Germany, the " +
                        "villagers and the extraterrestrials must coexist. Flynn " +
                        "meticulously details the aliens' gravity-manipulation drive and " +
                        "how 14th-century scholars attempt to understand it using " +
                        "Aristotelian physics.",
                    relevance:
                        "A masterclass in hard-SF gravity-drive mechanics set against " +
                        "an unexpected historical backdrop.",
                    difficulty: "Advanced Science",
                    bloom_score: 82,
                },
                {
                    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
                    title: "Mission of Gravity",
                    author: "Hal Clement",
                    genre: "Hard Science Fiction",
                    summary:
                        "On the disc-shaped planet Mesklin, surface gravity varies from " +
                        "3 g at the equator to nearly 700 g at the poles. A tiny " +
                        "caterpillar-like alien leads an expedition across this crushing " +
                        "landscape to retrieve a stranded human probe.",
                    relevance:
                        "The gold-standard novel for exploring how variable gravity " +
                        "shapes biology, culture, and adventure.",
                    difficulty: "Beginner",
                    bloom_score: 91,
                },
                {
                    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
                    title: "Pushing Gravity: New Perspectives on Le Sage's Theory of " +
                        "Gravitation",
                    author: "Matthew R. Edwards (Editor)",
                    genre: "Speculative Non-Fiction",
                    summary:
                        "A collection of academic essays revisiting Le Sage's mechanical " +
                        "theory of gravity—the idea that gravity is caused by the " +
                        "shielding of an omnidirectional flux of ultra-mundane particles. " +
                        "Contributors explore whether such models could ever lead to " +
                        "gravity shielding or propulsion.",
                    relevance:
                        "For readers who want the real physics: peer-reviewed " +
                        "perspectives on alternative gravity theories and their " +
                        "antigravity implications.",
                    difficulty: "Advanced Science",
                    bloom_score: 74,
                },
            ];

            return { recommendations };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            logger.error("getAntigravityRecommendations failed:", message, error);
            throw new HttpsError(
                "internal",
                `Failed to get recommendations: ${message}`
            );
        }
    }
);

export * from "./verification/identity";
export * from "./verification/certificates";
export * from "./verification/profiles";
export * from "./verification/skillTest";
export * from "./verification/reviews";
export * from "./notifications";
export * from "./tuitionMatching";
export * from "./chat";
export * from "./corsConfig";

export const onCommunityMessageCreate = onDocumentCreated(
  "communities/{communityId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    if (!messageData) return;

    const db = getFirestore();
    const communityRef = db.collection("communities").doc(event.params.communityId);

    return communityRef.update({
      lastMessage: messageData.content || "Image sent",
      lastMessageTimestamp: FieldValue.serverTimestamp(),
    });
  }
);

export * from "./payments";
export * from "./aiAssistant";
export * from "./analytics";
