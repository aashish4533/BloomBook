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
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Paperclip, Loader2, Download, Lock } from 'lucide-react';
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
  /** When true, chat is embedded in a page instead of a full-screen overlay. */
  embedded?: boolean;
}

export const PrivateChat = ({ otherUser, currentUserId, onBack, chatId, embedded = false }: PrivateChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dummy = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());

  const { initialized, shield, reconstruct } = useNeuralPrivacy(currentUserId);

  // 1. Subscribe to Real-time Updates (after E2EE keys are ready)
  useEffect(() => {
    if (!chatId || !initialized) return;
    seenMessageIdsRef.current = new Set();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
            return { ...msg, text: plain ?? '[Cannot decrypt — keys may not match 🔒]' };
          }
          return msg;
        })
      );

      setMessages(list);

      setTimeout(() => {
        dummy.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId, otherUser.id, otherUser.name, initialized, reconstruct]);

  // 2. Send Message Function (E2EE text via neural_vault / ECDH + AES-GCM)
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

      await addDoc(collection(db, "chats", chatId, "messages"), {
        ciphertext: enc.ciphertext,
        iv: enc.iv,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser?.displayName || "User"
      });
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: '🔒 Encrypted message',
        lastMessageTimestamp: serverTimestamp()
      });
      notifyChatRecipient({
        recipientUserId: otherUser.id,
        senderLabel: auth.currentUser?.displayName || 'Someone',
        preview: 'Sent you an encrypted message. Open chat to read.',
        chatId,
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
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
      const summary = `📎 ${file.name}`;
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: summary,
        fileUrl,
        fileName: file.name,
        senderId: currentUserId,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser?.displayName || "User"
      });
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: summary,
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      notifyChatRecipient({
        recipientUserId: otherUser.id,
        senderLabel: auth.currentUser?.displayName || 'Someone',
        preview: `Shared a file: ${file.name}`,
        chatId,
      });
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Could not upload file. Check your connection and storage permissions.");
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

        {/* Header (Added to support Back navigation) */}
        <div className="bg-[#C4A672] p-4 flex items-center text-white shadow-sm gap-2">
          <button onClick={onBack} className="mr-2 hover:bg-white/20 p-1 rounded-full text-white shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg flex-1 min-w-0 truncate">{otherUser.name}</div>
          <div className="flex items-center gap-1 text-xs bg-white/15 px-2 py-1 rounded-md shrink-0" title="Text messages use end-to-end encryption on this device. File links are sent over HTTPS; download only from people you trust.">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">E2EE</span>
          </div>
        </div>

        {/* User's Original UI Structure - Flex 1 to fill remaining space */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {!initialized && (
            <div className="absolute inset-0 z-10 bg-gray-50/90 flex items-center justify-center text-sm text-gray-600 p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#C4A672]" />
              Securing your chat…
            </div>
          )}
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm break-words ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'
                    }`}>
                    {msg.text ? <p className="text-sm">{msg.text}</p> : null}
                    {msg.fileUrl && (
                      <div className={`mt-2 flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        <button
                          type="button"
                          onClick={() => {
                            void downloadFile(msg.fileUrl!, msg.fileName || 'attachment');
                            toast.success('Download started');
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
                            isMe
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-[#C4A672] text-white hover:bg-[#8B7355]'
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
              );
            })}
            <div ref={dummy}></div>
          </div>

          {/* Input Area */}
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


