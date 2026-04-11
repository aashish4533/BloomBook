import React, { useState, useEffect, useRef } from 'react';
import { db, auth, storage } from '../../firebase';
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Paperclip, Loader2, Download, Lock, Reply, X } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '../../utils/fileHandler';
import { useNeuralPrivacy } from '../../hooks/useNeuralPrivacy';
import { notifyChatRecipient } from '../../utils/chatNotifications';

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

export const PrivateChat = ({ otherUser, currentUserId, onBack, chatId, embedded = false }: PrivateChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<(Message & { displayText: string }) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummy = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const displayByIdRef = useRef<Record<string, string>>({});

  const { initialized, shield, reconstruct } = useNeuralPrivacy(currentUserId);

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
            const plain = await reconstruct(msg.ciphertext, msg.iv, otherUser.id);
            return { ...msg, text: plain ?? '[Cannot decrypt — keys may not match]' };
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
  }, [chatId, currentUserId, otherUser.id, otherUser.name, initialized, reconstruct]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !initialized) return;

    try {
      const enc = await shield(newMessage.trim(), otherUser.id);
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
        recipientUserId: otherUser.id,
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
        recipientUserId: otherUser.id,
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
            ? 'w-full bg-white flex flex-col h-[min(480px,70vh)]'
            : 'w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-[calc(100dvh-2rem)] max-h-[800px]'
        }
      >
        <div className="bg-[#C4A672] p-4 flex items-center text-white shadow-sm gap-2">
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {!initialized && (
            <div className="absolute inset-0 z-10 bg-gray-50/90 flex items-center justify-center text-sm text-gray-600 p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#C4A672]" />
              Securing your chat…
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
            <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-sm text-gray-700">
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

          <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2 shrink-0 items-center">
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
              disabled={uploadingFile}
              className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              title="Send material (attach file)"
            >
              {uploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !initialized}
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
