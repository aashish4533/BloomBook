/**
 * ╔════════════════════════════════════════════════╗
 * ║  useNeuralPrivacy — Neural Identity Hook       ║
 * ║  Manages key generation, local vault storage   ║
 * ║  and public key registration in Firestore.     ║
 * ╚════════════════════════════════════════════════╝
 *
 * Cognitive Thread: Keys are stored per Firebase uid so switching accounts on the
 * same browser does not decrypt with the wrong identity. Legacy single-key storage
 * is migrated only when its public key matches `neural_vault/{uid}`.
 */

import { useState, useEffect, useCallback } from 'react';
import { get, set, del } from 'idb-keyval';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  generateIdentityKeyPair,
  exportPublicKey,
  exportPrivateKeyJwk,
  importPrivateKeyJwk,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from '../services/gravitationalShield';

const LEGACY_IDB_PRIVATE = 'neural_privateKeyJwk';
const LEGACY_IDB_PUBLIC = 'neural_publicKeyB64';

function idbPrivateKey(uid: string) {
  return `neural_privateKeyJwk_${uid}`;
}
function idbPublicKeyB64(uid: string) {
  return `neural_publicKeyB64_${uid}`;
}

interface NeuralPrivacyState {
  initialized: boolean;
  privateKey: CryptoKey | null;
  publicKeyB64: string | null;
}

// ─── Shared Key Cache (per-session, per-peer) ─────────────────────────────────
const sharedKeyCache = new Map<string, CryptoKey>();

/** Drop cached AES keys for a peer (e.g. after vault rotation or failed decrypt retry). */
export function clearNeuralSharedKeyCache(peerId?: string) {
  if (peerId) sharedKeyCache.delete(peerId);
  else sharedKeyCache.clear();
}

export function useNeuralPrivacy(currentUserId: string) {
  const [state, setState] = useState<NeuralPrivacyState>({
    initialized: false,
    privateKey: null,
    publicKeyB64: null,
  });

  // ── On mount: restore or generate the Neural Identity ──────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    sharedKeyCache.clear();

    (async () => {
      try {
        let privateKey: CryptoKey | null = null;
        let publicKeyB64: string | null = null;

        const idbPrivK = idbPrivateKey(currentUserId);
        const idbPubK = idbPublicKeyB64(currentUserId);

        let storedJwk = await get<JsonWebKey>(idbPrivK);
        let storedPub = await get<string>(idbPubK);

        if (!storedJwk || !storedPub) {
          const legacyJwk = await get<JsonWebKey>(LEGACY_IDB_PRIVATE);
          const legacyPub = await get<string>(LEGACY_IDB_PUBLIC);
          let migrateLegacy = false;
          if (legacyJwk && legacyPub) {
            try {
              const vaultSnap = await getDoc(doc(db, 'neural_vault', currentUserId));
              const vaultPub = vaultSnap.exists() ? (vaultSnap.data().publicKey as string) : null;
              if (vaultPub === legacyPub) {
                migrateLegacy = true;
              }
            } catch {
              /* ignore */
            }
          }
          if (migrateLegacy && legacyJwk && legacyPub) {
            storedJwk = legacyJwk;
            storedPub = legacyPub;
            await set(idbPrivK, storedJwk);
            await set(idbPubK, storedPub);
            await del(LEGACY_IDB_PRIVATE);
            await del(LEGACY_IDB_PUBLIC);
          }
        }

        if (storedJwk && storedPub) {
          privateKey = await importPrivateKeyJwk(storedJwk);
          publicKeyB64 = storedPub;
        } else {
          const keyPair = await generateIdentityKeyPair();
          privateKey = keyPair.privateKey;
          publicKeyB64 = await exportPublicKey(keyPair.publicKey);
          const privateJwk = await exportPrivateKeyJwk(privateKey);
          await set(idbPrivK, privateJwk);
          await set(idbPubK, publicKeyB64);
          await del(LEGACY_IDB_PRIVATE);
          await del(LEGACY_IDB_PUBLIC);
        }

        await setDoc(
          doc(db, 'neural_vault', currentUserId),
          { publicKey: publicKeyB64, updatedAt: new Date().toISOString() },
          { merge: true }
        );

        setState({ initialized: true, privateKey, publicKeyB64 });
      } catch (err) {
        console.error('[Neural Privacy] Identity initialization failed:', err);
      }
    })();
  }, [currentUserId]);

  // ── Retrieve a peer's public key from Firestore ──────────────────────────
  const getRecipientPublicKey = useCallback(async (peerId: string): Promise<CryptoKey | null> => {
    try {
      const snap = await getDoc(doc(db, 'neural_vault', peerId));
      if (!snap.exists()) return null;
      return importPublicKey(snap.data().publicKey as string);
    } catch {
      return null;
    }
  }, []);

  // ── Derive (and cache) a Stabilized Communication Orbit shared key ────────
  const getSharedKey = useCallback(
    async (peerId: string): Promise<CryptoKey | null> => {
      if (!state.privateKey) return null;

      if (sharedKeyCache.has(peerId)) return sharedKeyCache.get(peerId)!;

      const peerPublicKey = await getRecipientPublicKey(peerId);
      if (!peerPublicKey) return null;

      try {
        const sharedKey = await deriveSharedKey(state.privateKey, peerPublicKey);
        sharedKeyCache.set(peerId, sharedKey);
        return sharedKey;
      } catch (err) {
        console.error('[Neural Privacy] Key derivation failed:', err);
        return null;
      }
    },
    [state.privateKey, getRecipientPublicKey]
  );

  // ── Encrypt a message for a specific peer ────────────────────────────────
  const shield = useCallback(
    async (
      plaintext: string,
      peerId: string
    ): Promise<{ ciphertext: string; iv: string } | null> => {
      const sharedKey = await getSharedKey(peerId);
      if (!sharedKey) return null;
      return encryptMessage(plaintext, sharedKey);
    },
    [getSharedKey]
  );

  // ── Decrypt using shared secret with this peer (1:1: pass the other participant’s uid) ──
  const reconstruct = useCallback(
    async (ciphertext: string, iv: string, peerId: string): Promise<string | null> => {
      const sharedKey = await getSharedKey(peerId);
      if (!sharedKey) return null;
      return decryptMessage(ciphertext, iv, sharedKey);
    },
    [getSharedKey]
  );

  return {
    initialized: state.initialized,
    publicKeyB64: state.publicKeyB64,
    shield,       // "Gravitational Shielding" — encrypt for a peer
    reconstruct,  // "Neural Reconstruction" — decrypt from a peer
  };
}
