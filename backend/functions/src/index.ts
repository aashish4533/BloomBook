import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

export { getAntigravityRecommendations } from "./personalizedRecommendations";
export { onBookCreatedWishlistMatch } from "./wishlistMatchOnBookCreate";

export * from "./verification/identity";
export * from "./verification/certificates";
export * from "./verification/profiles";
export * from "./verification/skillTest";
export * from "./verification/reviews";
export * from "./verification/bookCondition";
export * from "./verification/studentVerification";
export * from "./notifications";
export * from "./tuitionMatching";
export {
  proposeTuitionAgreement,
  acceptTuitionAgreement,
  expireTuitionAgreementsSchedule,
  onTuitionRequestAssignedAgreementTimer,
} from "./tuitionAgreement";
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
export { sendAdminEmailOtp, verifyAdminEmailOtp } from "./adminEmailOtp";
