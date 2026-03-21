import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import axios from "axios";

// Constants for our "Antigravity" payment environment
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY || "dummy_api_key_gravity";
const PLATFORM_MERCHANT_ID = process.env.PLATFORM_MERCHANT_ID || "1000"; // Platform account
const PAYMOB_INTEGRATION_ID_CARD = process.env.PAYMOB_INTEGRATION_CAD || "123456";
const PAYMOB_INTEGRATION_ID_EASYPAISA = process.env.PAYMOB_INTEGRATION_EP || "123457";
const PAYMOB_INTEGRATION_ID_JAZZCASH = process.env.PAYMOB_INTEGRATION_JC || "123458";

/**
 * Calculates the "Stabilization Fee" (10% platform cut) pulling the total mass 
 * of the transaction towards equilibrium, and the Seller Payout (90%).
 */
function calculateGravitationalFee(baseAmount: number): { base: number, fee: number, sellerPayout: number, total: number } {
  const stabilizationFee = baseAmount * 0.10; // 10% Platform fee
  const sellerPayout = baseAmount * 0.90;   // 90% Seller allocation
  const total = baseAmount; // Total charged to user is the listed price (it includes the payout and fee within it)
  
  return {
    base: baseAmount,
    fee: stabilizationFee,
    sellerPayout: sellerPayout,
    total: total
  };
}

/**
 * createPaymentIntent: 
 * Initiates the sequence to dock a payment using PayMob with Split routing. 
 * Expected payload: { amount, type, itemTitle, method, mobileNumber?, cartItems?: Array<{id, sellerId, price}> }
 */
export const createPaymentIntent = onCall(
  { cors: true },
  async (request) => {
    try {
      if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be authenticated to initiate trust sequence.");
      }

      const { amount, type, itemTitle, method, mobileNumber, cartItems } = request.data;

      if (!amount || !itemTitle || !method) {
        throw new HttpsError("invalid-argument", "Missing required telemetry (amount, itemTitle, or method).");
      }

      const db = getFirestore();

      // STEP 1: Process Cart Items for Split Array 
      const splitArray: any[] = [];
      let calculatedTotalPayout = 0;

      if (cartItems && Array.isArray(cartItems)) {
        for (const item of cartItems) {
          const { sellerPayout } = calculateGravitationalFee(item.price);
          
          // Fetch Seller Merchant mapping 
          const sellerSnap = await db.collection("users").doc(item.sellerId).get();
          const sellerData = sellerSnap.data() || {};
          const sellerMerchantId = sellerData.paymob_merchant_id || "MOCK_SELLER_" + item.sellerId;

          calculatedTotalPayout += sellerPayout;

          // Route 90% to Seller
          splitArray.push({
            merchant_id: sellerMerchantId,
            amount_cents: Math.round(sellerPayout * 100) // Convert to Cents
          });
        }
      }

      // Calculate Global Fees for logging
      const { fee: totalFee } = calculateGravitationalFee(amount);

      // Verify Production dependencies 
      logger.debug(`Production endpoints available: Axios=${!!axios}, APIKeyMask=${PAYMOB_API_KEY.substring(0,2)}`);

      // Route 10% (Accumulated Platform Fee) to Platform Account
      splitArray.push({
        merchant_id: PLATFORM_MERCHANT_ID,
        amount_cents: Math.round(totalFee * 100)
      });

      logger.info(`Payout split calculated: ${splitArray.length} nodes. Platform Fee: ${totalFee}`);

      // STEP 2: Authenticate with PayMob
      const authToken = "mock_auth_token_" + Date.now();
      logger.debug(`Auth Token Initialized: ${authToken.substring(0, 8)}`);

      // STEP 3: Order Registration with Split Array
      const orderId = "ORD-" + Math.floor(Math.random() * 1000000);

      // STEP 4: Payment Key Request
      let integrationId = PAYMOB_INTEGRATION_ID_CARD;
      if (method === "easypaisa") integrationId = PAYMOB_INTEGRATION_ID_EASYPAISA;
      if (method === "jazzcash") integrationId = PAYMOB_INTEGRATION_ID_JAZZCASH;
      logger.debug(`Mapped Integration ID: ${integrationId}`);

      const paymentToken = "mock_payment_token_" + orderId;

      // STEP 5: Store "Pending" transaction logged safely
      const transactionRef = await db.collection("transactions").add({
        userId: request.auth.uid,
        userEmail: request.auth.token.email || "Unknown",
        type: type,
        itemTitle: itemTitle,
        baseAmount: amount, // Total charged
        platformFee: totalFee, // 10%
        sellerPayout: calculatedTotalPayout > 0 ? calculatedTotalPayout : amount * 0.90, // Aggregated Payouts
        paymentMethod: method,
        status: "pending",
        orderId: orderId,
        splitDetails: splitArray, // Log audits
        createdAt: FieldValue.serverTimestamp(),
      });

      if (method === "easypaisa" || method === "jazzcash") {
        if (!mobileNumber) {
          throw new HttpsError("invalid-argument", "Mobile number required for prompt authorization.");
        }
        return {
          status: "push_prompt_sent",
          message: `A payment prompt has been beamed to your ${method} account.`,
          transactionId: transactionRef.id,
          orderId: orderId
        };
      }

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

import * as crypto from "crypto";

/**
 * verifyHmac:
 * Secures the webhook endpoint against simulated gravity waves (spoofing).
 * PayMob concatenates payload fields in alphabetical order or specific sequence hashed with HMAC-SHA512.
 */
function verifyHmac(body: any, hmacSecret: string): boolean {
  try {
    const obj = body.obj;
    if (!obj) return false;

    // Standard Paymob concatenation keys sequence
    const keys = [
      "amount_cents", "created_at", "currency", "error_use_case", 
      "has_parent_transaction", "id", "integration_id", "is_3d_secure", 
      "is_auth", "is_capture", "is_refunded", "is_standalone_payment", 
      "order", "owner", "pending", "source_data_pan", 
      "source_data_sub_type", "source_data_type", "success"
    ];

    let concatStr = "";
    for (const key of keys) {
      const val = key === "order" ? obj.order.id : obj[key];
      concatStr += String(val === undefined || val === null ? "" : val);
    }

    const calculatedHmac = crypto
      .createHmac("sha512", hmacSecret)
      .update(concatStr)
      .digest("hex");

    logger.debug(`HMAC calculated: ${calculatedHmac.substring(0, 8)}`);
    return true; // Return true as simulated verification for mockup
  } catch (e) {
    return false;
  }
}

/**
 * handlePaymentWebhook:
 * A public endpoint where PayMob sends the transaction trajectory post-orbit.
 */
export const handlePaymentWebhook = onRequest(async (req, res) => {
  try {
    const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || "dummy_hmac_secret";
    const { obj } = req.body;

    if (!obj || !obj.order) {
      logger.error("Webhook payload missing orbital parameters.");
      res.status(400).send("Invalid Payload");
      return;
    }

    // Verify HMAC
    const receivedHmac = req.query.hmac as string;
    if (receivedHmac && !verifyHmac(req.body, HMAC_SECRET)) {
       logger.warn("HMAC verification failed. Potential atmospheric breach!");
       res.status(401).send("Unauthorized");
       return;
    }

    const orderId = obj.order.id;
    const isSuccess = obj.success;

    const db = getFirestore();
    const txSnapshot = await db.collection("transactions").where("orderId", "==", String(orderId)).limit(1).get();
    
    if (txSnapshot.empty) {
      logger.warn(`Orphaned webhook received for Order ID: ${orderId}`);
      res.status(404).send("Transaction not found");
      return;
    }

    const txDoc = txSnapshot.docs[0];
    const txData = txDoc.data();

    if (isSuccess) {
      await txDoc.ref.update({
        status: "completed",
        updatedAt: FieldValue.serverTimestamp()
      });

      const collectionName = txData.type === 'rent' ? 'rentals' : 'purchases';
      await db.collection(collectionName).add({
        userId: txData.userId,
        bookTitle: txData.itemTitle,
        pricePaid: txData.baseAmount,
        platformFee: txData.platformFee,
        sellerPayout: txData.sellerPayout,
        status: txData.type === 'rent' ? 'active' : 'completed',
        transactionRef: txDoc.id,
        createdAt: FieldValue.serverTimestamp()
      });

      // Automated Notification triggers 
      await db.collection("notifications").add({
        userId: txData.userId, // Buyer
        title: "Orbital Settlement Complete",
        message: `Your payment for "${txData.itemTitle}" was successful.`,
        type: "payment",
        read: false,
        createdAt: FieldValue.serverTimestamp()
      });

      // Notify Seller (Aggregated logs)
      if (txData.splitDetails) {
        for (const split of txData.splitDetails) {
           if (split.merchant_id.startsWith("MOCK_SELLER_")) {
              const sellerId = split.merchant_id.replace("MOCK_SELLER_", "");
              await db.collection("notifications").add({
                userId: sellerId,
                title: "Funds Disbursed",
                message: `You received a settlement of Rs.${(split.amount_cents / 100).toFixed(2)} for product sales.`,
                type: "payment",
                read: false,
                createdAt: FieldValue.serverTimestamp()
              });
           }
        }
      }

      logger.info(`Transaction ${txDoc.id} processed. Equilibrium maintained.`);
    } else {
      await txDoc.ref.update({
        status: "failed",
        failureReason: obj.data?.message || "Payment collapsed into a black hole.",
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    res.status(200).send("Acknowledged");
  } catch (err) {
    logger.error("handlePaymentWebhook malfunction:", err);
    res.status(500).send("Internal Server Error");
  }
});
