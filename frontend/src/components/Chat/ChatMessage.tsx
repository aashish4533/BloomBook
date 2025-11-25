// Updated src/components/Chat/ChatMessage.tsx
import { Download } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    images?: string[];
    files?: { name: string; url: string; type: string }[];
    timestamp: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    isOwn: boolean;
  };
  showAvatar?: boolean;
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
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
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case 'sending':
        return <span className="text-gray-400">⏱</span>;
      case 'sent':
        return <span className="text-gray-400">✓</span>;
      case 'delivered':
        return <span className="text-gray-400">✓✓</span>;
      case 'read':
        return <span className="text-blue-500">✓✓</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex gap-2 max-w-[70%] ${
          message.isOwn ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        {showAvatar && !message.isOwn && (
          <div className="w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
            {message.senderAvatar}
          </div>
        )}

        <div className="flex flex-col">
          {/* Sender Name (for group chats) */}
          {!message.isOwn && showAvatar && (
            <span className="text-xs text-gray-500 mb-1 ml-1">
              {message.senderName}
            </span>
          )}

          {/* Message Bubble */}
          <div
            className={`rounded-2xl p-3 ${
              message.isOwn
                ? 'bg-[#2C3E50] text-white rounded-br-none'
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
            }`}
          >
            {/* Text Content */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words text-sm">
                {message.content}
              </p>
            )}

            {/* Images */}
            {message.images && message.images.length > 0 && (
              <div
                className={`grid gap-2 ${
                  message.images.length === 1
                    ? 'grid-cols-1'
                    : message.images.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2'
                } ${message.content ? 'mt-2' : ''}`}
              >
                {message.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img, '_blank')}
                  />
                ))}
              </div>
            )}

            {/* Files */}
            {message.files && message.files.length > 0 && (
              <div className={`space-y-2 ${message.content ? 'mt-2' : ''}`}>
                {message.files.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    download={file.name}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      message.isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded flex items-center justify-center ${
                        message.isOwn ? 'bg-white/20' : 'bg-gray-300'
                      }`}
                    >
                      <span className="text-xs">
                        {file.type.split('/')[1]?.toUpperCase().slice(0, 3) || 'FILE'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-center">
                        <div className="text-center">{file.name}</div>
                        <div className="text-xs opacity-70">{file.type}</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp and Status */}
          <div
            className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
              message.isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            <span>{formatTime(message.timestamp)}</span>
            {message.isOwn && message.status && (
              <span className="flex items-center">{getStatusIcon(message.status)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}