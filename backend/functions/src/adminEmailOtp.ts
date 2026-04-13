import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";
import nodemailer from "nodemailer";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

/** Bound to the send function; set with: firebase functions:secrets:set ADMIN_OTP_SMTP_USER (and _PASS). */
const adminSmtpUserSecret = defineSecret("ADMIN_OTP_SMTP_USER");
const adminSmtpPassSecret = defineSecret("ADMIN_OTP_SMTP_PASS");

/** Gen2 callables need public HTTP invoker (auth is verified from the request). Explicit origins satisfy browser CORS from Hosting. */
const ADMIN_CALLABLE_OPTS = {
  cors: [
    "https://bookbloom-2026.web.app",
    "https://bookbloom-2026.firebaseapp.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  invoker: "public" as const,
};

function resolveSmtpCreds(): { user: string; pass: string } | null {
  const fromSecretUser = adminSmtpUserSecret.value()?.trim() || "";
  const fromSecretPass = adminSmtpPassSecret.value()?.trim() || "";
  const user =
    fromSecretUser ||
    (process.env.ADMIN_OTP_SMTP_USER || process.env.EMAIL_USER || "").trim();
  const pass =
    fromSecretPass ||
    (process.env.ADMIN_OTP_SMTP_PASS || process.env.EMAIL_PASS || "").trim();
  if (!user || !pass) return null;
  return { user, pass };
}

function getSmtpTransporter(): nodemailer.Transporter | null {
  const creds = resolveSmtpCreds();
  if (!creds) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: creds.user, pass: creds.pass },
  });
}

function hashOtp(uid: string, otp: string): string {
  const pepper = process.env.ADMIN_OTP_PEPPER || "bookbloom-admin-otp-pepper";
  return crypto.createHash("sha256").update(`${pepper}|${uid}|${otp}`).digest("hex");
}

async function assertIsAdmin(uid: string): Promise<void> {
  const snap = await getFirestore().collection("users").doc(uid).get();
  if (!snap.exists || snap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Not an administrator.");
  }
}

export const sendAdminEmailOtp = onCall(
  {
    ...ADMIN_CALLABLE_OPTS,
    secrets: [adminSmtpUserSecret, adminSmtpPassSecret],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in first.");
    }
    const uid = request.auth.uid;
    const email = request.auth.token.email;
    if (!email) {
      throw new HttpsError("failed-precondition", "This account has no email address.");
    }

    await assertIsAdmin(uid);

    const db = getFirestore();
    const metaRef = db.collection("admin_login_otp_meta").doc(uid);
    const metaSnap = await metaRef.get();
    if (metaSnap.exists) {
      const last = metaSnap.data()?.lastSent as Timestamp | undefined;
      if (last && last.toMillis() > Date.now() - RESEND_COOLDOWN_MS) {
        throw new HttpsError("resource-exhausted", "Please wait a minute before requesting another code.");
      }
    }

    const transporter = getSmtpTransporter();
    if (!transporter) {
      logger.error("sendAdminEmailOtp: SMTP not configured");
      throw new HttpsError(
        "failed-precondition",
        "Admin email is not configured. Run: firebase functions:secrets:set ADMIN_OTP_SMTP_USER (Gmail address) and firebase functions:secrets:set ADMIN_OTP_SMTP_PASS (Gmail app password), then firebase deploy --only functions:sendAdminEmailOtp. For the emulator use backend/functions/.env with ADMIN_OTP_SMTP_USER and ADMIN_OTP_SMTP_PASS."
      );
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const hash = hashOtp(uid, otp);
    const expiresAt = Timestamp.fromMillis(Date.now() + OTP_TTL_MS);

    await db.collection("admin_login_otps").doc(uid).set({
      hash,
      expiresAt,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    await metaRef.set({ lastSent: FieldValue.serverTimestamp() }, { merge: true });

    const creds = resolveSmtpCreds();
    const fromAddr =
      process.env.ADMIN_OTP_FROM?.trim() || creds?.user || "noreply@bookbloom.local";

    await transporter.sendMail({
      from: `"BookBloom Admin" <${fromAddr}>`,
      to: email,
      subject: "Your BookBloom admin login code",
      text: `Your verification code is: ${otp}. It expires in 10 minutes. If you did not try to sign in, ignore this email.`,
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #C4A672;">BookBloom Admin Verification</h2>
        <p>Use this code to finish signing in:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">
          ${otp}
        </div>
        <p style="font-size: 12px; color: #666;">Expires in 10 minutes.</p>
      </div>
    `,
    });

    return { ok: true };
  }
);

export const verifyAdminEmailOtp = onCall(ADMIN_CALLABLE_OPTS, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }
  const uid = request.auth.uid;
  const code = String(request.data?.code || "").trim();
  if (!/^\d{6}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Enter the 6-digit code from your email.");
  }

  await assertIsAdmin(uid);

  const db = getFirestore();
  const ref = db.collection("admin_login_otps").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "No code is pending. Go back and sign in again to receive a new email.");
  }

  const data = snap.data()!;
  const expiresAt = data.expiresAt as Timestamp;
  if (expiresAt.toMillis() < Date.now()) {
    await ref.delete();
    throw new HttpsError("deadline-exceeded", "That code has expired. Request a new one.");
  }

  let attempts = (data.attempts as number) || 0;
  if (attempts >= MAX_ATTEMPTS) {
    await ref.delete();
    throw new HttpsError("permission-denied", "Too many wrong attempts. Sign in again for a new code.");
  }

  if (hashOtp(uid, code) !== data.hash) {
    await ref.update({ attempts: attempts + 1 });
    throw new HttpsError("permission-denied", "Invalid code.");
  }

  await ref.delete();
  return { ok: true };
});
