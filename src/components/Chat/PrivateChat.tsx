import { useState, useRef, useEffect } from 'react';
<<<<<<< HEAD
import { ArrowLeft, Send, Image as ImageIcon, Paperclip, MoreVertical, Smile, X, Archive, Undo } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner@2.0.3';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
=======
import { ArrowLeft, Send, Image as ImageIcon, Paperclip, MoreVertical, Smile, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner@2.0.3';
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b

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

export function PrivateChat({ otherUser, bookContext, onBack, currentUserId }: PrivateChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: otherUser.id,
      senderName: otherUser.name,
      senderAvatar: otherUser.avatar,
      content: 'Hi! I\'m interested in this book. Is it still available?',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read',
      isOwn: false
    },
    {
      id: '2',
      senderId: currentUserId,
      senderName: 'You',
      senderAvatar: 'ME',
      content: 'Yes, it\'s still available! It\'s in great condition.',
      timestamp: new Date(Date.now() - 3000000),
      status: 'read',
      isOwn: true
    },
    {
      id: '3',
      senderId: otherUser.id,
      senderName: otherUser.name,
      senderAvatar: otherUser.avatar,
      content: 'Great! Can you provide more details about the condition?',
      timestamp: new Date(Date.now() - 2400000),
      status: 'read',
      isOwn: false
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
<<<<<<< HEAD
  const [isArchived, setIsArchived] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

=======
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
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
      status: 'sending',
      isOwn: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setSelectedImages([]);

    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? { ...m, status: 'sent' } : m))
      );
    }, 500);

    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? { ...m, status: 'delivered' } : m))
      );
    }, 1000);

    // Simulate other user typing
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 bg-gradient-to-b from-[#E0F7FA] to-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00ACC1] to-[#0097A7] text-white p-4 flex items-center justify-between shadow-lg">
=======
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white p-4 flex items-center justify-between shadow-lg">
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
<<<<<<< HEAD
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-lg border-2 border-white/30">
              {otherUser.avatar}
            </div>
            {otherUser.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
=======
            <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-lg">
              {otherUser.avatar}
            </div>
            {otherUser.online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            )}
          </div>
          <div>
            <div className="text-lg">{otherUser.name}</div>
<<<<<<< HEAD
            <div className="text-sm text-white/90">
=======
            <div className="text-sm text-white/80">
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
              {otherUser.online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
<<<<<<< HEAD
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem onClick={handleArchive} className="cursor-pointer hover:bg-gray-100">
              <Archive className="w-4 h-4 mr-2" />
              Archive Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
=======
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <MoreVertical className="w-5 h-5" />
        </Button>
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
      </div>

      {/* Book Context (if applicable) */}
      {bookContext && (
        <div className="bg-[#C4A672]/10 border-b border-[#C4A672]/30 p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <img
              src={bookContext.image}
              alt={bookContext.title}
              className="w-16 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <div className="text-[#2C3E50]">{bookContext.title}</div>
              <div className="text-2xl text-[#C4A672]">${bookContext.price}</div>
            </div>
            <Button
              size="sm"
              className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              View Book
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
<<<<<<< HEAD
      <div className="flex-1 overflow-y-auto p-4">
=======
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#FAF8F3] to-white">
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[70%] ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {!message.isOwn && (
<<<<<<< HEAD
                  <div className="w-8 h-8 bg-gradient-to-br from-[#00ACC1] to-[#0097A7] rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 shadow-md">
=======
                  <div className="w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
                    {message.senderAvatar}
                  </div>
                )}
                <div>
                  <div
<<<<<<< HEAD
                    className={`rounded-2xl p-3 shadow-sm ${
                      message.isOwn
                        ? 'bg-[#00ACC1] text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md border border-gray-100'
=======
                    className={`rounded-2xl p-3 ${
                      message.isOwn
                        ? 'bg-[#2C3E50] text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
                    }`}
                  >
                    {message.content && (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    {message.images && message.images.length > 0 && (
                      <div className={`grid ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 ${message.content ? 'mt-2' : ''}`}>
                        {message.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Attachment"
                            className="rounded-lg max-w-full"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.isOwn && (
                      <span className="flex items-center">{getStatusIcon(message.status)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-sm">
                  {otherUser.avatar}
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
                  <div className="flex gap-1">
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
              placeholder="Type a message..."
              className="pr-12 min-h-[44px]"
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
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white flex-shrink-0"
            size="lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
