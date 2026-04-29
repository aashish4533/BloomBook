import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage, functions } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Paperclip, Loader2, Download, Lock, Reply, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '../../utils/fileHandler';
import { useNeuralPrivacy, clearNeuralSharedKeyCache } from '../../hooks/useNeuralPrivacy';
import { notifyChatRecipient } from '../../utils/chatNotifications';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface Message {
  id: string;
  text?: string;
  senderId: string;
  createdAt: any;
  fileUrl?: string;
  fileName?: string;
  ciphertext?: string;
  iv?: string;
  replyToId?: string;
  replySnippet?: string;
}

interface PrivateChatProps {
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
  };
  bookContext?: {
    id: string;
    title: string;
    price: number;
    image: string;
  };
  onBack: () => void;
  currentUserId: string;
  chatId: string;
  embedded?: boolean;
}

function replyPreviewForMessage(msg: Message, displayText: string): string {
  if (msg.fileUrl || msg.fileName) {
    return msg.fileName ? `File: ${msg.fileName}` : 'Attachment';
  }
  const t = (displayText || '').replace(/\s+/g, ' ').trim();
  return t.length > 120 ? `${t.slice(0, 120)}…` : t || 'Message';
}

function PrivateChatMessageBubble({
  chatId,
  currentUserId,
  msg,
  displayText,
  isMe,
  onReply,
}: {
  chatId: string;
  currentUserId: string;
  msg: Message;
  displayText: string;
  isMe: boolean;
  onReply: () => void;
}) {
  const [reactions, setReactions] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'chats', chatId, 'messages', msg.id, 'reactions'),
      (snap) => {
        const next: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const e = d.data().emoji;
          if (typeof e === 'string') next[d.id] = e;
        });
        setReactions(next);
      },
      () => {}
    );
    return () => unsub();
  }, [chatId, msg.id]);

  const myEmoji = reactions[currentUserId];
  const aggregated = Object.values(reactions).reduce(
    (acc, emoji) => {
      acc[emoji] = (acc[emoji] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const toggleReaction = async (emoji: string) => {
    try {
      const ref = doc(db, 'chats', chatId, 'messages', msg.id, 'reactions', currentUserId);
      if (myEmoji === emoji) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { emoji, createdAt: serverTimestamp() }, { merge: true });
      }
    } catch {
      toast.error('Could not update reaction');
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
        <div
          className={`max-w-[85%] sm:max-w-xs px-4 py-2 rounded-lg shadow-sm break-words ${
            isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'
          }`}
        >
          {msg.replySnippet && (
            <div
              className={`text-xs mb-2 pl-2 border-l-2 py-1 rounded ${
                isMe ? 'border-white/60 bg-black/10' : 'border-gray-400 bg-gray-50 text-gray-600'
              }`}
            >
              {msg.replySnippet}
            </div>
          )}
          {displayText ? <p className="text-sm whitespace-pre-wrap">{displayText}</p> : null}
          {msg.fileUrl && (
            <div className={`mt-2 flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
              <button
                type="button"
                onClick={() => {
                  void downloadFile(msg.fileUrl!, msg.fileName || 'attachment');
                  toast.success('Download started');
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                  isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-[#C4A672] text-white hover:bg-[#8B7355]'
                }`}
              >
                <Download className="w-4 h-4 shrink-0" />
                Download
              </button>
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs underline ${isMe ? 'text-white/90' : 'text-blue-600'}`}
              >
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex flex-wrap items-center gap-1 max-w-[85%] sm:max-w-xs ${isMe ? 'justify-end' : 'justify-start'} opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity`}
      >
        <button
          type="button"
          onClick={onReply}
          className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
        {['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}'].map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => toggleReaction(e)}
            className={`px-1.5 py-0.5 rounded-md text-sm border ${
              myEmoji === e ? 'border-[#C4A672] bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      {Object.keys(aggregated).length > 0 && (
        <div
          className={`flex flex-wrap gap-1 text-xs bg-white border border-gray-200 rounded-full px-2 py-0.5 shadow-sm ${
            isMe ? 'self-end' : 'self-start'
          }`}
        >
          {Object.entries(aggregated).map(([emoji, count]) => (
            <span key={emoji}>
              {emoji}
              {count > 1 ? <span className="text-gray-500 ml-0.5">{count}</span> : null}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDeadline(ts: unknown): string {
  try {
    const t = ts as { toDate?: () => Date };
    if (t && typeof t.toDate === 'function') return t.toDate().toLocaleString();
  } catch {
    /* ignore */
  }
  return '';
}

const DECRYPT_FAIL_HINT =
  '[Cannot decrypt — keys may not match. This can happen if someone changed devices, cleared site data, or a different account used this browser before.]';

export const PrivateChat = ({ otherUser, currentUserId, onBack, chatId, embedded = false }: PrivateChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<(Message & { displayText: string }) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummy = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const displayByIdRef = useRef<Record<string, string>>({});

  /** Other participant uid from chat doc (authoritative for E2EE); state from navigation can be wrong. */
  const [cipherPeerId, setCipherPeerId] = useState(otherUser.id);

  const [tuitionPair, setTuitionPair] = useState<{ studentId: string; tutorId: string } | null>(null);
  const [agreementState, setAgreementState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [agreement, setAgreement] = useState<Record<string, unknown> | null>(null);
  const [dealDraft, setDealDraft] = useState('');
  const [agreementBusy, setAgreementBusy] = useState(false);

  const { initialized, shield, reconstruct } = useNeuralPrivacy(currentUserId);

  const cryptoPeerId = cipherPeerId || otherUser.id;

  useEffect(() => {
    setCipherPeerId(otherUser.id);
  }, [otherUser.id]);

  const isTuitionThread = tuitionPair !== null;
  const agreementStatus = agreement?.status as string | undefined;
  const messagingAllowed =
    !isTuitionThread || (agreementState === 'ready' && agreementStatus === 'accepted');

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      const sid = d?.studentId;
      const tid = d?.tutorId;
      if (typeof sid === 'string' && typeof tid === 'string') {
        setTuitionPair({ studentId: sid, tutorId: tid });
      } else {
        setTuitionPair(null);
      }
      if (currentUserId && Array.isArray(d?.participants)) {
        const other = d.participants.find(
          (p: unknown) => typeof p === 'string' && (p as string).length > 0 && p !== currentUserId
        );
        if (other) setCipherPeerId(other as string);
      }
    });
    return () => unsub();
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!chatId || !tuitionPair) {
      setAgreementState('idle');
      setAgreement(null);
      return;
    }
    setAgreementState('loading');
    const unsub = onSnapshot(
      doc(db, 'tuition_agreements', chatId),
      (snap) => {
        setAgreementState('ready');
        setAgreement(snap.exists() ? snap.data()! : null);
      },
      () => {
        setAgreementState('ready');
        setAgreement(null);
      }
    );
    return () => unsub();
  }, [chatId, tuitionPair]);

  useEffect(() => {
    if (!chatId || !initialized) return;
    seenMessageIdsRef.current = new Set();

    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Message[];

      const prevIds = seenMessageIdsRef.current;
      const isHydrating = prevIds.size === 0;

      if (!isHydrating) {
        for (const msg of rawList) {
          if (!prevIds.has(msg.id) && msg.senderId !== currentUserId) {
            if (msg.fileUrl) {
              const label = msg.fileName || 'a file';
              toast.success('New material received', {
                description: `${otherUser.name} sent ${label}.`,
              });
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                  new Notification('New material in chat', {
                    body: `${otherUser.name} sent ${label}`,
                  });
                } catch {
                  /* ignore */
                }
              }
            } else {
              toast.success('New message', {
                description: `${otherUser.name}: ${
                  msg.ciphertext ? 'Encrypted message (tuition chat)' : (msg.text || '').slice(0, 100) || '…'
                }`,
              });
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                try {
                  new Notification(`Message from ${otherUser.name}`, {
                    body: msg.ciphertext ? 'New encrypted message' : (msg.text || '').slice(0, 120) || 'Open chat',
                  });
                } catch {
                  /* ignore */
                }
              }
            }
          }
        }
      }

      seenMessageIdsRef.current = new Set(rawList.map((m) => m.id));

      const list = await Promise.all(
        rawList.map(async (msg) => {
          if (msg.ciphertext && msg.iv) {
            const rawText = typeof msg.text === 'string' ? msg.text.trim() : '';
            const preservedPlaintext =
              rawText && !rawText.startsWith('[Cannot decrypt') ? msg.text as string : '';

            const tryDecrypt = async (peerId: string) => {
              let p = await reconstruct(msg.ciphertext!, msg.iv!, peerId);
              if (p == null) {
                clearNeuralSharedKeyCache(peerId);
                p = await reconstruct(msg.ciphertext!, msg.iv!, peerId);
              }
              return p;
            };

            let plain: string | null = await tryDecrypt(cryptoPeerId);
            if (
              plain == null &&
              msg.senderId &&
              msg.senderId !== currentUserId &&
              msg.senderId !== cryptoPeerId
            ) {
              plain = await tryDecrypt(msg.senderId);
            }
            if (plain != null) {
              return { ...msg, text: plain };
            }
            if (preservedPlaintext) {
              return { ...msg, text: preservedPlaintext };
            }
            if (rawText && rawText !== DECRYPT_FAIL_HINT) {
              return { ...msg, text: rawText };
            }
            return {
              ...msg,
              text: DECRYPT_FAIL_HINT,
            };
          }
          return msg;
        })
      );

      const disp: Record<string, string> = {};
      list.forEach((m) => {
        disp[m.id] = m.text || (m.fileName ? `File: ${m.fileName}` : '');
      });
      displayByIdRef.current = disp;

      const enriched = list.map((m) => {
        if (!m.replySnippet && m.replyToId && disp[m.replyToId]) {
          const s = disp[m.replyToId];
          return { ...m, replySnippet: s.length > 120 ? `${s.slice(0, 120)}…` : s };
        }
        return m;
      });

      setMessages(enriched);

      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId, otherUser.id, otherUser.name, cryptoPeerId, initialized, reconstruct]);

  const proposeDeal = async () => {
    const text = dealDraft.trim();
    if (text.length < 20) {
      toast.error('Write at least 20 characters describing the deal.');
      return;
    }
    setAgreementBusy(true);
    try {
      const fn = httpsCallable(functions, 'proposeTuitionAgreement');
      await fn({ chatId, agreementText: text });
      toast.success('Agreement sent. The other party has 2 days to accept.');
      setDealDraft('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit agreement';
      toast.error(msg);
    } finally {
      setAgreementBusy(false);
    }
  };

  const acceptDeal = async () => {
    setAgreementBusy(true);
    try {
      const fn = httpsCallable(functions, 'acceptTuitionAgreement');
      await fn({ chatId });
      toast.success('Agreement accepted. You can message now.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not accept';
      toast.error(msg);
    } finally {
      setAgreementBusy(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !initialized) return;
    if (!messagingAllowed) {
      toast.error('Finalize the tuition agreement above before messaging.');
      return;
    }

    try {
      const enc = await shield(newMessage.trim(), cryptoPeerId);
      if (!enc) {
        toast.error('Could not encrypt message', {
          description: `${otherUser.name} may need to open BookBloom once so their encryption key is registered.`,
        });
        return;
      }

      const payload: Record<string, unknown> = {
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser?.displayName || 'User',
      };
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
        payload.replySnippet = replyPreviewForMessage(replyingTo, replyingTo.displayText);
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), payload);
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: 'Encrypted message',
        lastMessageTimestamp: serverTimestamp(),
      });
      notifyChatRecipient({
        recipientUserId: cryptoPeerId,
        senderLabel: auth.currentUser?.displayName || 'Someone',
        preview: 'Sent you an encrypted message. Open chat to read.',
        chatId,
      });
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!messagingAllowed) {
      toast.error('Finalize the tuition agreement above before sending files.');
      return;
    }
    if (!file || !auth.currentUser?.email) {
      if (!auth.currentUser?.email) {
        alert('Your account needs an email to upload files.');
      }
      return;
    }
    setUploadingFile(true);
    try {
      const safeName = file.name.replace(/\s+/g, '_');
      const storagePath = `helping-material/${auth.currentUser.email}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      const summary = `File: ${file.name}`;
      const payload: Record<string, unknown> = {
        text: summary,
        fileUrl,
        fileName: file.name,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser?.displayName || 'User',
      };
      if (replyingTo) {
        payload.replyToId = replyingTo.id;
        payload.replySnippet = replyPreviewForMessage(replyingTo, replyingTo.displayText);
      }
      await addDoc(collection(db, 'chats', chatId, 'messages'), payload);
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: summary,
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      notifyChatRecipient({
        recipientUserId: cryptoPeerId,
        senderLabel: auth.currentUser?.displayName || 'Someone',
        preview: `Shared a file: ${file.name}`,
        chatId,
      });
      setReplyingTo(null);
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Could not upload file. Check your connection and storage permissions.');
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? 'relative w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden'
          : 'fixed inset-0 bg-gray-100 flex items-center justify-center p-4 z-50'
      }
    >
      <div
        className={
          embedded
            ? 'private-chat-shell private-chat-shell--embedded w-full bg-white'
            : 'private-chat-shell w-full max-w-2xl bg-white rounded-lg shadow-xl'
        }
      >
        <div className="private-chat-header bg-[#C4A672] p-4 flex items-center text-white shadow-sm gap-2">
          <button onClick={onBack} className="mr-2 hover:bg-white/20 p-1 rounded-full text-white shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg flex-1 min-w-0 truncate">{otherUser.name}</div>
          <div
            className="flex items-center gap-1 text-xs bg-white/15 px-2 py-1 rounded-md shrink-0"
            title="Text messages use end-to-end encryption on this device. File links are sent over HTTPS; download only from people you trust."
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">E2EE</span>
          </div>
        </div>

        <div className="private-chat-body relative">
          {isTuitionThread && (
            <div className="border-b border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-[#2C3E50] space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <FileText className="w-4 h-4 text-[#C4A672] shrink-0" />
                Tuition agreement (required before chat)
              </div>
              {agreementState === 'loading' && (
                <p className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Loading deal status…
                </p>
              )}
              {agreementState === 'ready' && agreementStatus === 'accepted' && (
                <p className="text-green-800">Deal accepted. Messaging is open.</p>
              )}
              {agreementState === 'ready' && agreementStatus === 'pending_acceptance' && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Accept by: {formatDeadline(agreement?.acceptDeadlineAt)}. If this is not accepted in time, both accounts
                    can lose tuition verification (automated).
                  </p>
                  <div className="rounded-md bg-white border p-2 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {String(agreement?.agreementText || '')}
                  </div>
                  {agreement?.proposedBy !== currentUserId && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                      disabled={agreementBusy}
                      onClick={() => void acceptDeal()}
                    >
                      Accept this agreement
                    </Button>
                  )}
                  {agreement?.proposedBy === currentUserId && (
                    <p className="text-xs text-amber-900">Waiting for the other party to accept.</p>
                  )}
                </div>
              )}
              {agreementState === 'ready' &&
                agreementStatus !== 'accepted' &&
                agreementStatus !== 'pending_acceptance' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-700">
                      Either side writes the deal; the other must accept within 2 days. Assigned tuition requests also expire
                      after 2 days without an accepted deal.
                    </p>
                    <Textarea
                      value={dealDraft}
                      onChange={(e) => setDealDraft(e.target.value)}
                      placeholder="e.g. Weekly 2× sessions, rate, mode (online/in-person), start date, cancellation…"
                      className="min-h-[88px] text-sm bg-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#2C3E50] text-white hover:bg-[#1a252f]"
                      disabled={agreementBusy}
                      onClick={() => void proposeDeal()}
                    >
                      Submit agreement for other party
                    </Button>
                  </div>
                )}
            </div>
          )}
          {!initialized && (
            <div className="absolute inset-0 z-10 bg-gray-50/90 flex items-center justify-center text-sm text-gray-600 p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#C4A672]" />
              Securing your chat…
            </div>
          )}
          <div className="private-chat-messages-scroll p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const displayText =
                msg.text ||
                (msg.fileUrl && !msg.ciphertext
                  ? msg.fileName
                    ? `File: ${msg.fileName}`
                    : 'Attachment'
                  : '');
              return (
                <PrivateChatMessageBubble
                  key={msg.id}
                  chatId={chatId}
                  currentUserId={currentUserId}
                  msg={msg}
                  displayText={displayText}
                  isMe={isMe}
                  onReply={() =>
                    setReplyingTo({
                      ...msg,
                      displayText: displayText || replyPreviewForMessage(msg, displayText),
                    })
                  }
                />
              );
            })}
            <div ref={dummy}></div>
          </div>

          {replyingTo && (
            <div className="private-chat-reply-preview px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-sm text-gray-700">
              <span className="truncate">
                Replying to <strong>{replyingTo.senderId === currentUserId ? 'yourself' : otherUser.name}</strong>
                {replyingTo.displayText ? `: ${replyingTo.displayText.slice(0, 80)}${replyingTo.displayText.length > 80 ? '…' : ''}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 text-gray-500 hover:text-gray-800 shrink-0"
                aria-label="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={sendMessage} className="private-chat-composer p-4 border-t bg-white flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xlsx,.csv"
              onChange={handleFileChange}
              disabled={uploadingFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || !messagingAllowed}
              className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              title="Send material (attach file)"
            >
              {uploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={messagingAllowed ? 'Type a message…' : 'Accept the tuition agreement first…'}
              disabled={!messagingAllowed}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !initialized || !messagingAllowed}
              className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
