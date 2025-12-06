import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Users, MoreVertical, Smile, X, UserPlus, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatMessage } from '../Chat/ChatMessage';
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  images?: string[];
  files?: { name: string; url: string; type: string }[];
  timestamp: Date;
  isOwn: boolean;
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
  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<{ file: File; preview: string }[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch messages
    const q = query(
      collection(db, 'communities', communityId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const msgData = doc.data();
        return {
          id: doc.id,
          ...msgData,
          timestamp: msgData.timestamp.toDate(),
          isOwn: msgData.senderId === currentUserId
        } as Message;
      });
      setMessages(data);
    });

    // Fetch members
    const unsubMembers = onSnapshot(collection(db, 'communities', communityId, 'members'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(data);
    });

    return () => {
      unsubMessages();
      unsubMembers();
    };
  }, [communityId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const onlineCount = members.filter(m => m.online).length;

  const handleSend = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;

    try {
      const imageUrls: string[] = [];

      // Upload images to Cloudinary
      for (const img of selectedImages) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          throw new Error("Cloudinary configuration missing");
        }

        const formData = new FormData();
        formData.append('file', img.file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Image upload failed');
        const data = await response.json();
        imageUrls.push(data.secure_url);
      }

      await addDoc(collection(db, 'communities', communityId, 'messages'), {
        senderId: currentUserId,
        senderName: 'You',
        senderAvatar: 'ME',
        content: newMessage,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
      setSelectedImages([]);
      toast.success('Message sent');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const preview = URL.createObjectURL(file);
      setSelectedImages(prev => [...prev, { file, preview }]);
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
            <div className="text-lg truncate">{communityName}</div>
            <div className="text-sm text-white/80">
              {onlineCount} online • {members.length} members
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => setShowMembers(!showMembers)}
          >
            <Users className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#FAF8F3] to-white">
            <div className="max-w-3xl mx-auto space-y-2">
              {/* Date Divider */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  Today
                </div>
              </div>

              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} showAvatar={true} />
              ))}

              {/* Typing Indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-sm">
                      JD
                    </div>
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
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img src={img.preview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="max-w-3xl mx-auto flex items-end gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${communityName}...`}
                  className="pr-12 min-h-[44px]"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <Button
                onClick={handleSend}
                disabled={!newMessage.trim() && selectedImages.length === 0}
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white flex-shrink-0"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Members Sidebar (Desktop) or Modal (Mobile) */}
        {showMembers && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[#2C3E50] text-lg">Members</h3>
                  <button
                    onClick={() => setShowMembers(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {onlineCount} online • {members.length} total
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                          {member.avatar}
                        </div>
                        {member.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#2C3E50] truncate">{member.name}</div>
                        <div className="text-xs text-gray-500">
                          {member.role === 'admin' ? '👑 Admin' : member.online ? 'Online' : 'Offline'}
                        </div>
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
                    <button
                      onClick={() => setShowMembers(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {onlineCount} online • {members.length} total
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {members.map((member) => (
                    <div key={member.id} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                            {member.avatar}
                          </div>
                          {member.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[#2C3E50] truncate">{member.name}</div>
                          <div className="text-xs text-gray-500">
                            {member.role === 'admin' ? '👑 Admin' : member.online ? 'Online' : 'Offline'}
                          </div>
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
