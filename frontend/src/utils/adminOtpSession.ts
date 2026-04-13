/** Persists admin email-OTP success across tabs until expiry or logout. */
const KEY = 'bookbloom_admin_otp_ok_until';
const TTL_MS = 8 * 60 * 60 * 1000;

export function markAdminOtpVerified(): void {
  localStorage.setItem(KEY, String(Date.now() + TTL_MS));
}

export function hasAdminOtpVerified(): boolean {
  const v = localStorage.getItem(KEY);
  if (!v) return false;
  const until = parseInt(v, 10);
  if (Number.isNaN(until) || Date.now() >= until) {
    localStorage.removeItem(KEY);
    return false;
  }
  return true;
}

export function clearAdminOtpSession(): void {
  localStorage.removeItem(KEY);
}
