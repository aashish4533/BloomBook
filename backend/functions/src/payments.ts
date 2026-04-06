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

      // Create a transaction doc in locked_for_payment
      const transactionRef = await db.collection("transactions").add({
        buyerId: request.auth.uid,
        sellerId: targetUserId,
        userEmail: request.auth.token.email || "Unknown",
        type: transactionType || 'buy',
        itemTitle: itemTitle || 'Payment',
        baseAmount: amount, // Total charged
        platformFee: 0, // 0%
        sellerPayout: amount,
        paymentMethod: 'p2p_escrow',
        status: "locked_for_payment",
        cartItems: cartItems || [],
        createdAt: FieldValue.serverTimestamp(),
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

/**
 * submitProofOfPayment:
 * Accepts transactionId and proofImageUrl.
 * Updates the transaction document to status: 'payment_claimed' and sets the proofUrl.
 * Triggers a notification to the Seller.
 */
export const submitProofOfPayment = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');
    const { transactionId, proofImageUrl } = request.data;

    const db = getFirestore();
    const txRef = db.collection("transactions").doc(transactionId);

    await db.runTransaction(async (t) => {
      const doc = await t.get(txRef);
      if (!doc.exists) throw new HttpsError('not-found', 'Transaction not found.');
      const data = doc.data()!;
      if (data.buyerId !== request.auth!.uid) throw new HttpsError('permission-denied', 'Only the buyer can submit proof.');
      if (data.status !== 'locked_for_payment') throw new HttpsError('failed-precondition', 'Transaction is not awaiting payment.');

      t.update(txRef, {
        status: 'payment_claimed',
        proofUrl: proofImageUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Notification
      const notificationRef = db.collection("notifications").doc();
      t.set(notificationRef, {
        userId: data.sellerId,
        title: "Payment Proof Uploaded",
        message: `Buyer has uploaded payment proof for "${data.itemTitle}". Please verify receipt in your bank app.`,
        type: "payment_proof",
        transactionId: transactionId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  }
);

/**
 * verifyPaymentReceived:
 * Can ONLY be called by the sellerId of the transaction. Updates the transaction document to status: 'completed'.
 */
export const verifyPaymentReceived = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');
    const { transactionId } = request.data;

    const db = getFirestore();
    const txRef = db.collection("transactions").doc(transactionId);

    await db.runTransaction(async (t) => {
      const doc = await t.get(txRef);
      if (!doc.exists) throw new HttpsError('not-found', 'Transaction not found.');
      const data = doc.data()!;

      if (data.sellerId !== request.auth!.uid) throw new HttpsError('permission-denied', 'Only the seller can verify payment receipt.');
      if (data.status !== 'payment_claimed') throw new HttpsError('failed-precondition', 'Transaction must have proof claimed first.');

      t.update(txRef, {
        status: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Complete the purchase/rental creation inside the db
      const collectionName = data.type === 'rent' ? 'rentals' : 'purchases';
      const orderRef = db.collection(collectionName).doc();
      t.set(orderRef, {
         userId: data.buyerId,
         bookTitle: data.itemTitle,
         pricePaid: data.baseAmount,
         sellerPayout: data.sellerPayout,
         status: data.type === 'rent' ? 'active' : 'completed',
         transactionRef: transactionId,
         ...(data.type === 'rent' ? { createdAt: FieldValue.serverTimestamp() } : { timestamp: FieldValue.serverTimestamp() }),
      });

      const buyerNotificationRef = db.collection("notifications").doc();
      t.set(buyerNotificationRef, {
        userId: data.buyerId,
        title: "Payment Verified",
        message: `Seller verified your payment for "${data.itemTitle}". Deal is now complete.`,
        type: "payment_complete",
        transactionId: transactionId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  }
);
