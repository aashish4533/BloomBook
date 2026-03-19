/**
 * ╔════════════════════════════════════════════════╗
 * ║  useNeuralPrivacy — Neural Identity Hook       ║
 * ║  Manages key generation, local vault storage   ║
 * ║  and public key registration in Firestore.     ║
 * ╚════════════════════════════════════════════════╝
 *
 * Cognitive Thread: Keys are only ever generated once per browser.
 * Private keys live exclusively in IndexedDB (idb-keyval).
 * Public keys are uploaded to the Firestore `neural_vault` collection.
 */

import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
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

// IndexedDB keys
const IDB_PRIVATE_KEY = 'neural_privateKeyJwk';
const IDB_PUBLIC_KEY  = 'neural_publicKeyB64';

interface NeuralPrivacyState {
  initialized: boolean;
  privateKey: CryptoKey | null;
  publicKeyB64: string | null;
}

// ─── Shared Key Cache (per-session, per-peer) ─────────────────────────────────
const sharedKeyCache = new Map<string, CryptoKey>();

export function useNeuralPrivacy(currentUserId: string) {
  const [state, setState] = useState<NeuralPrivacyState>({
    initialized: false,
    privateKey: null,
    publicKeyB64: null,
  });

  // ── On mount: restore or generate the Neural Identity ──────────────────────
  useEffect(() => {
    if (!currentUserId) return;

    (async () => {
      try {
        let privateKey: CryptoKey | null = null;
        let publicKeyB64: string | null = null;

        const storedJwk = await get<JsonWebKey>(IDB_PRIVATE_KEY);
        const storedPub = await get<string>(IDB_PUBLIC_KEY);

        if (storedJwk && storedPub) {
          // Restore existing identity from IndexedDB
          privateKey = await importPrivateKeyJwk(storedJwk);
          publicKeyB64 = storedPub;
        } else {
          // Generate a brand-new Neural Identity
          const keyPair = await generateIdentityKeyPair();
          privateKey = keyPair.privateKey;
          publicKeyB64 = await exportPublicKey(keyPair.publicKey);
          const privateJwk = await exportPrivateKeyJwk(privateKey);

          // Persist private key ONLY in browser IndexedDB
          await set(IDB_PRIVATE_KEY, privateJwk);
          await set(IDB_PUBLIC_KEY, publicKeyB64);
        }

        // Always sync public key to Firestore neural_vault (idempotent)
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

  // ── Decrypt a message from a specific peer ────────────────────────────────
  const reconstruct = useCallback(
    async (ciphertext: string, iv: string, senderId: string): Promise<string | null> => {
      const sharedKey = await getSharedKey(senderId);
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
