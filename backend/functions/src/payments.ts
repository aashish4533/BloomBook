import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * initiateP2PDeal:
 * Initiates the sequence to dock a manual P2P payment.
 * Creates a transaction document locked for manual payment processing.
 */
export const initiateP2PDeal = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const { amount, targetUserId, transactionType, itemTitle, cartItems } = request.data;

    try {
      const db = getFirestore();

      // 1. SECURITY CHECK: Verify the Seller/Lender/Tutor has a receiving account setup
      const payoutSnapshot = await db
        .collection('users').doc(targetUserId)
        .collection('payoutDetails').doc('primary')
        .get();

      if (!payoutSnapshot.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Transaction failed: The seller/lender/tutor has not set up a receiving bank account yet.'
        );
      }

      // Create a transaction doc - simplified and marked as completed immediately
      const transactionRef = await db.collection("transactions").add({
        buyerId: request.auth.uid,
        sellerId: targetUserId,
        userEmail: request.auth.token.email || "Unknown",
        type: transactionType || 'buy',
        itemTitle: itemTitle || 'Order',
        baseAmount: amount, // Total charged
        platformFee: 0, 
        sellerPayout: amount,
        paymentMethod: 'system_confirmation',
        status: "completed", // Bypassing locked_for_payment
        cartItems: cartItems || [],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2. Immediately create the purchase/rental record
      const collectionName = transactionType === 'rent' ? 'rentals' : 'purchases';
      await db.collection(collectionName).add({
         userId: request.auth.uid,
         bookTitle: itemTitle,
         pricePaid: amount,
         sellerId: targetUserId,
         status: transactionType === 'rent' ? 'active' : 'completed',
         transactionRef: transactionRef.id,
         ...(transactionType === 'rent' ? { createdAt: FieldValue.serverTimestamp() } : { timestamp: FieldValue.serverTimestamp() }),
      });

      return {
        transactionId: transactionRef.id,
        status: 'locked_for_payment',
      };
    } catch (error: any) {
      logger.error("Payment Error:", error);
      throw new HttpsError('internal', error.message || 'Payment initialization failed');
    }
  }
);

/* 
  LEGACY P2P VERIFICATION FLOWS
  The functions below are disabled in the current financial pivot.
  They are preserved here as comments for potential future escrow reinstatement.

export const submitProofOfPayment = onCall(
  { cors: true },
  async (request) => {
    ...
  }
);

export const verifyPaymentReceived = onCall(
  { cors: true },
  async (request) => {
    ...
  }
);

export const confirmPhysicalHandover = onCall(
  { cors: true },
  async (request) => {
    ...
  }
);
*/
