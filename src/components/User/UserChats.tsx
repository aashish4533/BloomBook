import { useState } from 'react';
import { MessageCircle, Users, Search, Archive, Star, Clock } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';

interface UserChatsProps {
  onOpenChat?: (chatId: string, type: 'private' | 'group') => void;
}

export function UserChats({ onOpenChat }: UserChatsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'groups'>('all');

  // Mock data - in real app, this would come from state/API
  const privateChats = [
    {
      id: '1',
      type: 'private' as const,
      name: 'Sarah Chen',
      lastMessage: 'Thanks for the book recommendation!',
      timestamp: '5 min ago',
      unread: 2,
      online: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bookContext: 'The Great Gatsby - $12',
    },
    {
      id: '2',
      type: 'private' as const,
      name: 'Michael Torres',
      lastMessage: 'Is the book still available?',
      timestamp: '1 hour ago',
      unread: 0,
      online: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bookContext: '1984 - $8',
    },
    {
      id: '3',
      type: 'private' as const,
      name: 'Emma Wilson',
      lastMessage: 'When can we meet for the exchange?',
      timestamp: '2 hours ago',
      unread: 5,
      online: true,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bookContext: 'Pride and Prejudice - $10',
    },
    {
      id: '4',
      type: 'private' as const,
      name: 'James Rodriguez',
      lastMessage: 'Great transaction! Thanks',
      timestamp: '1 day ago',
      unread: 0,
      online: false,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bookContext: 'To Kill a Mockingbird - $15',
    },
  ];

  const groupChats = [
    {
      id: '5',
      type: 'group' as const,
      name: 'Science Fiction Lovers',
      lastMessage: 'Alex: Has anyone read Foundation?',
      timestamp: '10 min ago',
      unread: 8,
      members: 1250,
      avatar: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=150',
    },
    {
      id: '6',
      type: 'group' as const,
      name: 'Mystery & Thriller Club',
      lastMessage: 'Sophie: New Agatha Christie discussion',
      timestamp: '30 min ago',
      unread: 3,
      members: 890,
      avatar: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=150',
    },
    {
      id: '7',
      type: 'group' as const,
      name: 'Classic Literature',
      lastMessage: 'David: Monthly book club meeting tomorrow',
      timestamp: '2 hours ago',
      unread: 0,
      members: 2100,
      avatar: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150',
    },
  ];

  const allChats = [...privateChats, ...groupChats].sort((a, b) => {
    // Sort by timestamp (most recent first)
    const timeA = parseTimeToMinutes(a.timestamp);
    const timeB = parseTimeToMinutes(b.timestamp);
    return timeA - timeB;
  });

  function parseTimeToMinutes(time: string): number {
    if (time.includes('min')) return parseInt(time);
    if (time.includes('hour')) return parseInt(time) * 60;
    if (time.includes('day')) return parseInt(time) * 1440;
    return 999999;
  }

  const filteredChats = allChats.filter(chat => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'private' && chat.type === 'private') ||
                      (activeTab === 'groups' && chat.type === 'group');
    return matchesSearch && matchesTab;
  });

  const totalUnread = allChats.reduce((sum, chat) => sum + chat.unread, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-[#2C3E50] mb-2">Messages</h2>
          <p className="text-gray-600">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Archived
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-[#C4A672] text-[#C4A672]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({allChats.length})
        </button>
        <button
          onClick={() => setActiveTab('private')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'private'
              ? 'border-[#C4A672] text-[#C4A672]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Private ({privateChats.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'groups'
              ? 'border-[#C4A672] text-[#C4A672]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Groups ({groupChats.length})
        </button>
      </div>

      {/* Chat List */}
      <div className="space-y-2">
        {filteredChats.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No messages found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onOpenChat?.(chat.id, chat.type)}
              className={`bg-white rounded-xl border border-gray-200 p-4 hover:border-[#C4A672] hover:shadow-md transition-all cursor-pointer ${
                chat.unread > 0 ? 'bg-[#F5F1E8]/30' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#C4A672] to-[#8B7355]">
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                  </div>
                  {chat.type === 'private' && 'online' in chat && chat.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                  {chat.type === 'group' && (
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#2C3E50] rounded-full flex items-center justify-center border-2 border-white">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-[#2C3E50] truncate ${chat.unread > 0 ? 'font-semibold' : ''}`}>
                      {chat.name}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {chat.timestamp}
                      </span>
                      {chat.unread > 0 && (
                        <Badge className="bg-[#C4A672] hover:bg-[#C4A672]">
                          {chat.unread}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm text-gray-600 line-clamp-1 mb-2 ${chat.unread > 0 ? 'font-medium' : ''}`}>
                    {chat.lastMessage}
                  </p>

                  {/* Context Info */}
                  {chat.type === 'private' && 'bookContext' in chat && chat.bookContext && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {chat.bookContext}
                      </Badge>
                    </div>
                  )}

                  {chat.type === 'group' && 'members' in chat && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>{chat.members.toLocaleString()} members</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {filteredChats.length > 0 && (
        <div className="bg-gradient-to-r from-[#F5F1E8] to-white rounded-xl p-4 border border-[#C4A672]/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[#2C3E50] mb-1">Keep your conversations organized</h4>
              <p className="text-sm text-gray-600">Star important chats and archive old ones</p>
            </div>
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
