import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, Paperclip, MoreVertical, Smile, X, Archive, Undo } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { db, auth } from '../../firebase';
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
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isOwn: boolean;
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
}

const getStatusIcon = (status: Message['status']) => {
  switch (status) {
    case 'sending':
      return '⏱';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return <span className="text-blue-500">✓✓</span>;
  }
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  
  if (hours < 1) {
    const minutes = Math.floor(diff / 60000);
    return minutes < 1 ? 'Just now' : `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
};

function ChatMessage({ message, showAvatar }: { message: Message; showAvatar: boolean }) {
  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}>
      {showAvatar && !message.isOwn && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
          {message.senderAvatar}
        </div>
      )}
      <div className={`max-w-[70%] ${message.isOwn ? 'bg-[#C4A672] text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl p-3`}>
        {message.content && <p className="text-sm">{message.content}</p>}
        {message.images && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="" className="rounded-lg max-h-40 object-cover" />
            ))}
          </div>
        )}
        <div className="flex justify-between items-center mt-1 text-xs opacity-70">
          <span>{formatTime(message.timestamp)}</span>
          {message.isOwn && <span className="ml-2">{getStatusIcon(message.status)}</span>}
        </div>
      </div>
      {showAvatar && message.isOwn && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
          {message.senderAvatar}
        </div>
      )}
    </div>
  );
}

export function PrivateChat({ otherUser, bookContext, onBack, currentUserId }: PrivateChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatId = [currentUserId, otherUser.id].sort().join('_');  // Unique chat ID

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    return () => unsubscribe();
  }, [chatId, currentUserId]);

  const handleArchive = () => {
    setIsArchived(true);
    toast.success('Chat archived', {
      description: 'This conversation has been moved to archives',
      action: {
        label: 'Undo',
        onClick: () => {
          setIsArchived(false);
          toast.info('Chat restored');
        },
      },
    });
  };

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

  const handleSend = async () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;

    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUserId,
        senderName: 'You',
        senderAvatar: 'ME',
        content: newMessage,
        images: selectedImages.length > 0 ? selectedImages : undefined,
        timestamp: serverTimestamp(),
        status: 'sent'
      });
      setNewMessage('');
      setSelectedImages([]);
    } catch (err) {
      toast.error('Failed to send message');
      console.error(err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] p-4 flex items-center justify-between text-white shadow-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              {otherUser.avatar}
            </div>
            <div>
              <h2 className="text-lg">{otherUser.name}</h2>
              <p className="text-sm opacity-90">{otherUser.online ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2 hover:bg-white/10">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="w-4 h-4 mr-2" />
                Archive Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-[#FAF8F3] to-white">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                showAvatar={true}
              />
            ))}
            {isTyping && (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-gray-100"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-100"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-10"
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() && selectedImages.length === 0}
              className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {selectedImages.map((img, index) => (
                <div key={index} className="relative">
                  <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
