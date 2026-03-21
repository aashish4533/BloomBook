import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Users, MoreVertical, Smile, X, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatMessage } from '../Chat/ChatMessage';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNeuralPrivacy } from '../../hooks/useNeuralPrivacy';
import { Skeleton } from '../ui/skeleton';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;           // After Neural Reconstruction (decrypted, display only)
  ciphertext?: string;       // Raw ciphertext from Firestore
  iv?: string;               // AES-GCM Initialization Vector
  images?: string[];
  timestamp: Date;
  isOwn: boolean;
  shielded: boolean;         // Whether the message was E2E encrypted
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  role: 'admin' | 'member';
}

interface GroupChatProps {
  communityId: string;
  communityName: string;
  onBack: () => void;
  currentUserId: string;
}

export function GroupChat({ communityId, communityName, onBack, currentUserId }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync editing message content to Input
  useEffect(() => {
    if (editingMessage) {
      setNewMessage(editingMessage.content);
    } else {
      setNewMessage('');
    }
  }, [editingMessage]);

  // ── Neural Privacy: Gravitational Shielding layer ─────────────────────────
  const { initialized, shield, reconstruct } = useNeuralPrivacy(currentUserId);

  // ── Neural Reconstruction for a raw Firestore message ────────────────────
  const reconstructMessage = useCallback(async (raw: any, docId: string): Promise<Message> => {
    const isOwn = raw.senderId === currentUserId;
    let content = '[Encrypted Message 🔒]';
    let shielded = false;

    if (raw.encryptions && raw.encryptions[currentUserId]) {
      shielded = true;
      const myEnc = raw.encryptions[currentUserId];
      const decrypted = await reconstruct(myEnc.ciphertext, myEnc.iv, raw.senderId);
      content = decrypted ?? '[Cannot decrypt — key mismatch 🔒]';
    } else if (raw.ciphertext && raw.iv) {
      shielded = true;
      // Own messages were encrypted with recipient's key; others with our key
      const senderId = isOwn ? currentUserId : raw.senderId;
      const decrypted = await reconstruct(raw.ciphertext, raw.iv, senderId);
      content = decrypted ?? '[Cannot decrypt — key mismatch 🔒]';
    } else if (raw.content) {
      // Legacy plaintext message (pre-E2EE)
      content = raw.content;
    }

    return {
      id: docId,
      senderId: raw.senderId,
      senderName: raw.senderName,
      senderAvatar: raw.senderAvatar,
      content,
      images: raw.images,
      timestamp: raw.timestamp?.toDate() ?? new Date(),
      isOwn,
      shielded,
    };
  }, [currentUserId, reconstruct]);

  // ── Fetch messages & apply Neural Reconstruction ──────────────────────────
  useEffect(() => {
    if (!initialized) return; // Wait for keys to be ready before rendering

    const q = query(
      collection(db, 'communities', communityId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(q, async (snapshot) => {
      const decrypted = await Promise.all(
        snapshot.docs.map(d => reconstructMessage(d.data(), d.id))
      );
      setMessages(decrypted);
      setLoadingMessages(false);
    });

    const unsubMembers = onSnapshot(
      collection(db, 'communities', communityId, 'members'),
      (snapshot) => {
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      }
    );

    return () => {
      unsubMessages();
      unsubMembers();
    };
  }, [communityId, currentUserId, initialized, reconstructMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onlineCount = members.filter(m => m.online).length;

  // ── Gravitational Shielding — Send encrypted message ───────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;
    if (!initialized) { toast.error('Privacy shield initializing…'); return; }

    try {
      const imageUrls: string[] = [];
      for (const img of selectedImages) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) throw new Error('Cloudinary config missing');

        const form = new FormData();
        form.append('file', img.file);
        form.append('upload_preset', uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
        if (!res.ok) throw new Error('Image upload failed');
        const data = await res.json();
        imageUrls.push(data.secure_url);
      }

      const encryptions: Record<string, { ciphertext: string; iv: string }> = {};
      
      if (newMessage.trim()) {
        await Promise.all(members.map(async (m) => {
          try {
            const sh = await shield(newMessage.trim(), m.id);
            if (sh) encryptions[m.id] = sh;
          } catch (err) {
            console.error(`[E2EE] Encryption failed for member ${m.id}:`, err);
          }
        }));
      }

        const functions = getFunctions();
        const callChat = httpsCallable(functions, 'handleGroupChatMessage');

        const payload: any = {
          action: 'create',
          communityId,
          content: newMessage.trim(),
          encryptions: Object.keys(encryptions).length > 0 ? encryptions : undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
          replyTo: replyingTo ? { id: replyingTo.id, senderName: replyingTo.senderName } : undefined
        };

        if (editingMessage) {
          payload.action = 'edit';
          payload.messageId = editingMessage.id;
        }

        await callChat(payload);
        if (editingMessage) setEditingMessage(null);

      setNewMessage('');
      setSelectedImages([]);
      setReplyingTo(null);
    } catch (err) {
      console.error('[GroupChat] Send error:', err);
      toast.error('Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const functions = getFunctions();
      const callChat = httpsCallable(functions, 'handleGroupChatMessage');
      await callChat({ action: 'delete', communityId, messageId });
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const functions = getFunctions();
      const callChat = httpsCallable(functions, 'handleGroupChatMessage');
      await callChat({ action: 'react', communityId, messageId, emoji });
    } catch (err) {
      toast.error('Failed to react');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5MB'); return; }
      setSelectedImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-lg truncate flex items-center gap-2">
              {communityName}
              {/* E2EE Shield Indicator */}
              <span
                title={initialized ? 'Neural Privacy Stratosphere Active' : 'Initializing Gravitational Shield…'}
                className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  initialized
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 animate-pulse'
                }`}
              >
                <Lock className="w-3 h-3" />
                {initialized ? 'E2EE' : '…'}
              </span>
            </div>
            <div className="text-sm text-white/80">
              {onlineCount} online • {members.length} members
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowMembers(!showMembers)}>
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#FAF8F3] to-white">
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-center justify-center my-4">
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Messages are end-to-end encrypted via the Neural Privacy Stratosphere
                </div>
              </div>

              {!initialized && (
                <div className="text-center text-sm text-gray-500 py-8 animate-pulse">
                  Initializing Gravitational Shield…
                </div>
              )}

              {loadingMessages && initialized && (
                <div className="space-y-4 py-4">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-2 max-w-[70%]">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-48 rounded-2xl" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  showAvatar={true}
                  onReply={() => setReplyingTo(message)}
                  onEdit={() => setEditingMessage(message)}
                  onDelete={() => handleDeleteMessage(message.id)}
                  onReact={(emoji: string) => handleReactToMessage(message.id, emoji)}
                  communityId={communityId}
                  currentUserId={currentUserId}
                />
              ))}

              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-sm">JD</div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto">
                {selectedImages.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0">
                    <img src={img.preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply/Edit Context Banner */}
          {(replyingTo || editingMessage) && (
            <div className="border-t border-gray-100 p-2 bg-gray-50 flex items-center justify-between text-sm px-4">
              <div className="flex items-center gap-2 text-gray-600">
                {replyingTo ? (
                  <span>Replying to <strong>{replyingTo.senderName}</strong></span>
                ) : (
                  <span>Editing message</span>
                )}
              </div>
              <button onClick={() => { setReplyingTo(null); setEditingMessage(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="max-w-3xl mx-auto flex items-end gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-shrink-0">
                <ImageIcon className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Send a message..."
                  disabled={!initialized}
                  className="pr-12 min-h-[44px]"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <Button
                onClick={handleSend}
                disabled={(!newMessage.trim() && selectedImages.length === 0) || !initialized}
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white flex-shrink-0"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Members Sidebar (Desktop) */}
        {showMembers && (
          <>
            <div className="hidden md:block w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#2C3E50] text-lg">Members</h3>
                  <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">{onlineCount} online • {members.length} total</p>
              </div>
              <div className="divide-y divide-gray-100">
                {members.map(member => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white">{member.avatar}</div>
                        {member.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#2C3E50] truncate">{member.name}</div>
                        <div className="text-xs text-gray-500">{member.role === 'admin' ? '👑 Admin' : member.online ? 'Online' : 'Offline'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Modal */}
            <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
              <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[#2C3E50] text-lg">Members</h3>
                    <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">{onlineCount} online • {members.length} total</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {members.map(member => (
                    <div key={member.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white">{member.avatar}</div>
                          {member.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#2C3E50] truncate">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.role === 'admin' ? '👑 Admin' : member.online ? 'Online' : 'Offline'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
