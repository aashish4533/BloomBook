import type { IdTokenResult } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Firebase Authentication ID tokens are signed JWTs (OIDC).
 * Use {@link getFirebaseJwt} for `Authorization: Bearer <token>` on your own HTTPS APIs
 * that verify tokens with the Firebase Admin SDK or Firebase project keys.
 */

export async function getFirebaseJwt(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

export async function getFirebaseIdTokenResult(forceRefresh = false): Promise<IdTokenResult | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdTokenResult(forceRefresh);
}

/** Headers suitable for merging into `fetch` / `RequestInit` when the user is signed in. */
export async function getBearerAuthorizationHeader(
  forceRefresh = false
): Promise<Record<string, string>> {
  const token = await getFirebaseJwt(forceRefresh);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/**
 * Like `fetch`, but adds `Authorization: Bearer <Firebase ID token>` when a user is signed in.
 * Does not throw if unauthenticated; the request goes without the header (use for public endpoints
 * or handle 401 in the caller).
 */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const authHeader = await getBearerAuthorizationHeader();
  if (authHeader.Authorization) {
    headers.set('Authorization', authHeader.Authorization);
  }
  return fetch(input, { ...init, headers });
}
