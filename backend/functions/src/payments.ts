// backend/functions/src/payments.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Constants for our "Antigravity" payment environment
// Using placeholder URLs/Keys for the PayMob integration. 
// In a real-world scenario, these would be managed via defineString or environment variables.
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || "dummy_api_key_gravity";
logger.debug("Orbit sequence key verified:", PAYMOB_API_KEY ? "YES" : "NO");
const PAYMOB_INTEGRATION_ID_CARD = process.env.PAYMOB_INTEGRATION_CAD || "123456";
const PAYMOB_INTEGRATION_ID_EASYPAISA = process.env.PAYMOB_INTEGRATION_EP || "123457";
const PAYMOB_INTEGRATION_ID_JAZZCASH = process.env.PAYMOB_INTEGRATION_JC || "123458";

/**
 * Calculates the "Stabilization Fee" (2% platform cut) pulling the total mass 
 * of the transaction towards equilibrium. 
 */
function calculateGravitationalFee(baseAmount: number): { base: number, fee: number, total: number } {
  // A 2% fee to keep the marketplace from floating into the void
  const stabilizationFee = baseAmount * 0.02;
  const total = baseAmount + stabilizationFee;
  return {
    base: baseAmount,
    fee: stabilizationFee,
    total: total
  };
}

/**
 * createPaymentIntent: 
 * Initiates the sequence to dock a payment using PayMob. 
 * Expected payload: { amount, type, itemTitle, method ('card', 'easypaisa', 'jazzcash'), mobileNumber? }
 */
export const createPaymentIntent = onCall(
  { cors: true },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be authenticated to initiate thrust sequence.");
      }

      const { amount, type, itemTitle, method, mobileNumber } = request.data;

      // Ensure valid parameters
      if (!amount || !itemTitle || !method) {
        throw new HttpsError("invalid-argument", "Missing required telemetry (amount, itemTitle, or method).");
      }

      // Calculate the stabilization fee (Service Charge)
      const { base, fee, total } = calculateGravitationalFee(amount);
      
      logger.info(`Initiating payment for ${itemTitle}. Base: ${base}, Stabilization Fee: ${fee}, Total Mass: ${total}`);

      // STEP 1: Authenticate with PayMob (Mock payload generation)
      // In reality: POST https://accept.paymob.com/api/auth/tokens
      const authToken = "mock_auth_token_" + Date.now();
      logger.debug("Orbit authentication initialized:", authToken);

      // STEP 2: Order Registration
      // In reality: POST https://accept.paymob.com/api/ecommerce/orders
      const orderId = "ORD-" + Math.floor(Math.random() * 1000000);

      // STEP 3: Payment Key Request
      // Depending on the channel, select the correct integration ID
      let integrationId = PAYMOB_INTEGRATION_ID_CARD;
      if (method === "easypaisa") integrationId = PAYMOB_INTEGRATION_ID_EASYPAISA;
      if (method === "jazzcash") integrationId = PAYMOB_INTEGRATION_ID_JAZZCASH;
      
      logger.debug("Routing to trajectory ID:", integrationId);

      // In reality: POST https://accept.paymob.com/api/acceptance/payment_keys
      const paymentToken = "mock_payment_token_" + orderId;

      // STEP 4: Store "Pending" transaction in the Firestore nebula
      const db = getFirestore();
      
      const transactionRef = await db.collection("transactions").add({
        userId: request.auth.uid,
        userEmail: request.auth.token.email || "Unknown",
        type: type, // 'buy' | 'rent'
        itemTitle: itemTitle,
        baseAmount: base,
        stabilizationFee: fee, // 2% Platform fee
        totalAmount: total,
        paymentMethod: method,
        status: "pending",
        orderId: orderId,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Construct Response Payload
      // If mobile wallet, PayMob requires the payment to be pushed to the user's phone directly
      if (method === "easypaisa" || method === "jazzcash") {
        if (!mobileNumber) {
          throw new HttpsError("invalid-argument", "Mobile number required for warp-speed wallet transactions.");
        }
        
        // In reality: POST https://accept.paymob.com/api/acceptance/payments/pay
        // Payload: { source: { identifier: mobileNumber, subtype: "WALLET" }, payment_token: paymentToken }
        return {
          status: "push_prompt_sent",
          message: `A payment prompt has been beamed to your ${method === "easypaisa" ? "EasyPaisa" : "JazzCash"} account.`,
          transactionId: transactionRef.id,
          orderId: orderId
        };
      }

      // For Card payments, return standard iframe URL 
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/dummy_iframe_id?payment_token=${paymentToken}`;
      return {
        status: "iframe_ready",
        iframeUrl,
        transactionId: transactionRef.id,
        orderId: orderId
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown anomaly detected";
      logger.error("createPaymentIntent anomaly:", message);
      throw new HttpsError("internal", `Payment core failure: ${message}`);
    }
  }
);

/**
 * handlePaymentWebhook:
 * A public endpoint where PayMob sends the transaction trajectory post-orbit.
 */
export const handlePaymentWebhook = onRequest(async (req, res) => {
  try {
    // Determine context (usually PayMob sends 'obj' data)
    const { obj } = req.body;
    if (!obj || !obj.order) {
      logger.error("Webhook payload missing orbital parameters.");
      res.status(400).send("Invalid Payload");
      return;
    }

    const orderId = obj.order.id;
    const isSuccess = obj.success;

    // Verify HMAC Signature (Required for actual Paymob deployment)
    // const hmac = req.query.hmac;
    // verifyHmac(req.body, hmac);

    const db = getFirestore();
    
    // Locate the corresponding transaction in our gravity well
    const txSnapshot = await db.collection("transactions").where("orderId", "==", String(orderId)).limit(1).get();
    
    if (txSnapshot.empty) {
      logger.warn(`Orphaned webhook received for Order ID: ${orderId}`);
      res.status(404).send("Transaction not found");
      return;
    }

    const txDoc = txSnapshot.docs[0];
    const txData = txDoc.data();

    if (isSuccess) {
      // 1. Mark transaction as completed
      await txDoc.ref.update({
        status: "completed",
        updatedAt: FieldValue.serverTimestamp()
      });

      // 2. Deposit the item into 'purchases' or 'rentals' based on type
      const collectionName = txData.type === 'rent' ? 'rentals' : 'purchases';
      await db.collection(collectionName).add({
        userId: txData.userId,
        bookTitle: txData.itemTitle,
        pricePaid: txData.totalAmount,
        basePrice: txData.baseAmount,
        feePaid: txData.stabilizationFee,
        status: txData.type === 'rent' ? 'active' : 'completed',
        transactionRef: txDoc.id,
        date: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp()
      });

      logger.info(`Transaction ${txDoc.id} processed. The system's gravity remains stable.`);
    } else {
      // Mark as failed
      await txDoc.ref.update({
        status: "failed",
        failureReason: obj.data?.message || "Payment collapsed into a black hole.",
        updatedAt: FieldValue.serverTimestamp()
      });
      logger.warn(`Transaction ${txDoc.id} failed.`);
    }

    res.status(200).send("Acknowledged");
  } catch (err) {
    logger.error("handlePaymentWebhook malfunction:", err);
    res.status(500).send("Internal Server Error");
  }
});
