import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Users, MoreVertical, Smile, X, UserPlus, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatMessage } from '../Chat/ChatMessage';
import { toast } from 'sonner@2.0.3';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'user1',
      senderName: 'Sarah Johnson',
      senderAvatar: 'SJ',
      content: 'Welcome everyone to the Science Fiction Lovers community chat! Feel free to discuss your favorite books here.',
      timestamp: new Date(Date.now() - 7200000),
      isOwn: false
    },
    {
      id: '2',
      senderId: 'user2',
      senderName: 'John Doe',
      senderAvatar: 'JD',
      content: 'Thanks! Just finished Dune, anyone want to discuss?',
      timestamp: new Date(Date.now() - 5400000),
      isOwn: false
    },
    {
      id: '3',
      senderId: currentUserId,
      senderName: 'You',
      senderAvatar: 'ME',
      content: 'I\'d love to! The worldbuilding is incredible.',
      timestamp: new Date(Date.now() - 3600000),
      isOwn: true
    },
    {
      id: '4',
      senderId: 'user3',
      senderName: 'Jane Smith',
      senderAvatar: 'JS',
      content: 'Has anyone read the sequels? Worth it?',
      images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'],
      timestamp: new Date(Date.now() - 1800000),
      isOwn: false
    }
  ]);

  const [members, setMembers] = useState<Member[]>([
    { id: 'user1', name: 'Sarah Johnson', avatar: 'SJ', online: true, role: 'admin' },
    { id: 'user2', name: 'John Doe', avatar: 'JD', online: true, role: 'member' },
    { id: 'user3', name: 'Jane Smith', avatar: 'JS', online: true, role: 'member' },
    { id: 'user4', name: 'Mike Wilson', avatar: 'MW', online: false, role: 'member' },
    { id: 'user5', name: 'Emma Davis', avatar: 'ED', online: true, role: 'member' }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: 'You',
      senderAvatar: 'ME',
      content: newMessage,
      images: selectedImages.length > 0 ? selectedImages : undefined,
      timestamp: new Date(),
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setSelectedImages([]);
    toast.success('Message sent');

    // Simulate someone typing
    setTimeout(() => {
      setTypingUsers(['John Doe']);
      setTimeout(() => setTypingUsers([]), 2000);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onlineCount = members.filter(m => m.online).length;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
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
            <div className="max-w-4xl mx-auto space-y-2">
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
              <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img src={img} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
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
            <div className="max-w-4xl mx-auto flex items-end gap-3">
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
                        <div className="flex-1">
                          <div className="text-[#2C3E50]">{member.name}</div>
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
