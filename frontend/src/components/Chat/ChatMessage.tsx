import { useState, useEffect } from 'react';
import { Download, Reply, Edit2, Trash } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

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
    edited?: boolean;
    replyTo?: { id: string; senderName: string };
  };
  showAvatar?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
  communityId?: string;
  currentUserId?: string;
}

export function ChatMessage({
  message,
  showAvatar = true,
  onReply,
  onEdit,
  onDelete,
  onReact,
  communityId,
  currentUserId,
}: ChatMessageProps) {
  const [reactions, setReactions] = useState<{ userId: string; emoji: string }[]>([]);

  useEffect(() => {
    if (!communityId || !message.id) return;
    const unsub = onSnapshot(collection(db, 'communities', communityId, 'messages', message.id, 'reactions'), (snap) => {
      setReactions(snap.docs.map(d => ({ userId: d.id, emoji: d.data().emoji })));
    });
    return () => unsub();
  }, [communityId, message.id]);

  const aggregatedReactions = reactions.reduce((acc, curr) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

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
      className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} mb-4 ${reactions.length > 0 ? 'pb-2' : ''}`}
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

          {/* Message Bubble with hover actions */}
          <div className="relative group">
            {/* Action Bar */}
            <div className={`absolute -top-3 flex gap-0.5 bg-white border border-gray-100 rounded-full shadow-md p-1 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${message.isOwn ? 'left-0' : 'right-0'}`}>
              {onReply && <button type="button" onClick={onReply} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Reply"><Reply className="w-3.5 h-3.5" /></button>}
              {onReact && <button type="button" onClick={() => onReact('👍')} className="p-1 hover:bg-gray-50 rounded text-base leading-none" title="React 👍">👍</button>}
              {onReact && <button type="button" onClick={() => onReact('❤️')} className="p-1 hover:bg-gray-50 rounded text-base leading-none" title="React ❤️">❤️</button>}
              {onReact && <button type="button" onClick={() => onReact('🔥')} className="p-1 hover:bg-gray-50 rounded text-base leading-none" title="React 🔥">🔥</button>}
              {onReact && <button type="button" onClick={() => onReact('😂')} className="p-1 hover:bg-gray-50 rounded text-base leading-none" title="React 😂">😂</button>}
              {message.isOwn && onEdit && <button type="button" onClick={onEdit} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>}
              {onDelete && <button type="button" onClick={onDelete} className="p-1 hover:bg-gray-100 rounded text-red-500" title="Delete"><Trash className="w-3.5 h-3.5" /></button>}
            </div>

            <div
              className={`rounded-2xl p-3 relative ${
                message.isOwn
                  ? 'bg-[#2C3E50] text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              {/* Reply Preview */}
              {message.replyTo && (
                <div className={`text-xs p-1.5 mb-2 rounded border-l-2 bg-black/5 flex flex-col ${message.isOwn ? 'border-sky-400' : 'border-gray-400'}`}>
                  <span className="font-semibold text-gray-500">{message.replyTo.senderName}</span>
                  <span className="opacity-80 truncate">Replying to message</span>
                </div>
              )}

              {/* Text Content */}
              {message.content && (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                  {message.edited && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}
                </p>
              )}

              {/* Images */}
              {message.images && message.images.length > 0 && (
                <div
                  className={`grid gap-2 ${
                    message.images.length === 1
                      ? 'grid-cols-1'
                      : 'grid-cols-2'
                  } ${message.content ? 'mt-2' : ''}`}
                >
                  {message.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
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
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${message.isOwn ? 'bg-white/20' : 'bg-gray-300'}`}>
                      <span className="text-xs">{file.type.split('/')[1]?.toUpperCase().slice(0, 3) || 'FILE'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div>
                        <div>{file.name}</div>
                        <div className="text-xs opacity-70">{file.type}</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 flex-shrink-0" />
                  </a>
                ))}
              </div>
            )}
            </div> {/* bubble end */}

            {/* Reactions Overlay */}
            {reactions.length > 0 && (
              <div className={`absolute -bottom-2 flex flex-wrap gap-1 bg-white border border-gray-100 rounded-full shadow-sm px-1.5 py-0.5 text-xs max-w-[min(100%,14rem)] ${message.isOwn ? 'right-2' : 'left-2'}`}>
                {Object.entries(aggregatedReactions).map(([emoji, count]) => {
                  const iReacted = !!currentUserId && reactions.some((r) => r.userId === currentUserId && r.emoji === emoji);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      disabled={!onReact}
                      onClick={() => onReact?.(emoji)}
                      className={`flex items-center gap-0.5 rounded-full px-1 py-0.5 hover:bg-gray-100 disabled:cursor-default ${iReacted ? 'ring-1 ring-[#C4A672] bg-amber-50/80' : ''}`}
                      title={iReacted ? 'Tap to remove your reaction' : onReact ? 'Tap to react' : `${count} reaction(s)`}
                    >
                      <span>{emoji}</span>
                      {count > 1 && <span className="text-gray-500 font-medium">{count}</span>}
                    </button>
                  );
                })}
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