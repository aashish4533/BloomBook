/**
 * ╔════════════════════════════════════════════════╗
 * ║  GRAVITATIONAL SHIELDING SERVICE               ║
 * ║  Neural Privacy Stratosphere — BookBloom       ║
 * ║  Algorithm: ECDH-P256 key exchange             ║
 * ║             AES-GCM (256-bit) message cipher   ║
 * ╚════════════════════════════════════════════════╝
 */

const ECDH_PARAMS: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' };
const AES_LENGTH = 256;

// ─── Key Pair Generation ────────────────────────────────────────────────────
/** Generates a fresh ECDH Identity Key Pair (Neural Identity). */
export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ECDH_PARAMS, true, ['deriveKey', 'deriveBits']);
}

// ─── Key Serialization ───────────────────────────────────────────────────────
/** Exports a public key to a base64 string (safe for Firestore neural_vault). */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('spki', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

/** Imports a base64 public key back into a CryptoKey for ECDH operations. */
export async function importPublicKey(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('spki', raw, ECDH_PARAMS, true, []);
}

/** Exports a private key as a JWK object (stored only in IndexedDB). */
export async function exportPrivateKeyJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/** Imports a private key from JWK (restored from IndexedDB). */
export async function importPrivateKeyJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, ECDH_PARAMS, true, ['deriveKey', 'deriveBits']);
}

// ─── Shared Secret Derivation ────────────────────────────────────────────────
/**
 * Derives a Stabilized Communication Orbit key using ECDH.
 * Both parties arrive at the same AES-GCM key without transmitting it.
 */
export async function deriveSharedKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: AES_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ─── Gravitational Shielding (Encryption) ────────────────────────────────────
/**
 * Applies Gravitational Shielding to the plaintext message.
 * Returns a base64 ciphertext and a base64 IV (initialization vector).
 * A new random IV is generated per message for forward secrecy.
 */
export async function encryptMessage(
  plaintext: string,
  sharedKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    sharedKey,
    encoded
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// ─── Neural Reconstruction (Decryption) ──────────────────────────────────────
/**
 * Performs Neural Reconstruction on the ciphertext.
 * Returns the original plaintext, or null if the decryption fails (wrong key / corrupted data).
 */
export async function decryptMessage(
  ciphertext: string,
  ivBase64: string,
  sharedKey: CryptoKey
): Promise<string | null> {
  try {
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      sharedKey,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return null; // Decryption failed — message may not be addressed to this user
  }
}
