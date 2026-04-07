// Updated src/components/User/UserChats.tsx
import { useState, useEffect } from 'react';
import { MessageCircle, Users, Search, Archive, Star, Clock } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, getDoc, doc, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UserChatsProps {
  onOpenChat?: (chatId: string, type: 'private' | 'group') => void;
}

export function UserChats({ onOpenChat }: UserChatsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'groups'>('all');
  const [privateChats, setPrivateChats] = useState<any[]>([]);
  const [groupChats, setGroupChats] = useState<any[]>([]);
  const [allChats, setAllChats] = useState<any[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      try {
        // Private chats — query the 'chats' collection (matches chatUtils.ts)
        const privateQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const privateSnap = await getDocs(privateQuery);

        // Resolve participant names for each chat
        const privateData = await Promise.all(
          privateSnap.docs.map(async (chatDoc) => {
            const data = chatDoc.data();
            const otherUid = (data.participants || []).find((p: string) => p !== user.uid);
            let otherName = 'Unknown User';
            let otherAvatar = '';

            if (otherUid) {
              try {
                const userDoc = await getDoc(doc(db, 'users', otherUid));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  otherName = userData.displayName || userData.name || 'User';
                  otherAvatar = userData.photoURL || userData.avatar || '';
                }
              } catch (err) {
                console.error('Failed to fetch user info:', err);
              }
            }

            return {
              id: chatDoc.id,
              name: otherName,
              avatar: otherAvatar,
              lastMessage: data.lastMessage || 'No messages yet',
              lastMessageTimestamp: data.lastMessageTimestamp || data.createdAt || null,
              timestamp: data.lastMessageTimestamp?.toDate
                ? new Date(data.lastMessageTimestamp.toDate()).toLocaleString()
                : data.createdAt?.toDate
                  ? new Date(data.createdAt.toDate()).toLocaleString()
                  : 'Just now',
              unread: 0,
              otherUserId: otherUid,
              otherUserName: otherName,
              otherUserAvatar: otherAvatar,
            };
          })
        );

        // Sort by timestamp descending
        privateData.sort((a, b) => {
          const aTime = a.lastMessageTimestamp?.toDate?.()?.getTime?.() || 0;
          const bTime = b.lastMessageTimestamp?.toDate?.()?.getTime?.() || 0;
          return bTime - aTime;
        });

        setPrivateChats(privateData);

        // Group chats (assuming user is member of groups)
        let groupData: any[] = [];
        try {
          const groupQuery = query(
            collection(db, 'groups'),
            where('members', 'array-contains', user.uid)
          );
          const groupSnap = await getDocs(groupQuery);
          groupData = groupSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            lastMessage: d.data().lastMessage || 'No messages',
            timestamp: d.data().lastMessageTimestamp?.toDate
              ? new Date(d.data().lastMessageTimestamp.toDate()).toLocaleString()
              : 'N/A',
          }));
        } catch (err) {
          // Groups collection may not exist; silently ignore
          console.warn('Groups query failed (collection may not exist):', err);
        }
        setGroupChats(groupData);

        // Combine and sort
        const combined = [
          ...privateData.map(c => ({ ...c, type: 'private' as const })),
          ...groupData.map(c => ({ ...c, type: 'group' as const }))
        ];
        setAllChats(combined);

        // Calculate unread
        const unread = combined.reduce((sum, c) => sum + (c.unreadCount || c.unread || 0), 0);
        setTotalUnread(unread);
      } catch (err) {
        toast.error('Failed to fetch chats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user]);

  const filteredChats = allChats.filter(chat => {
    const chatName = chat.name || '';
    const chatMsg = chat.lastMessage || '';
    const matchesSearch = chatName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chatMsg.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'private' && chat.type === 'private') ||
                      (activeTab === 'groups' && chat.type === 'group');
    return matchesSearch && matchesTab;
  });

  if (loading) return <div>Loading...</div>;

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
              onClick={() => {
                if (onOpenChat) {
                  onOpenChat(chat.id, chat.type);
                } else {
                  // Navigate to PrivateChat with the correct state
                  navigate('/chat', {
                    state: {
                      otherUser: {
                        id: chat.otherUserId,
                        name: chat.otherUserName || chat.name,
                        avatar: chat.otherUserAvatar || chat.avatar || '',
                        online: true
                      }
                    }
                  });
                }
              }}
              className={`bg-white rounded-xl border border-gray-200 p-4 hover:border-[#C4A672] hover:shadow-md transition-all cursor-pointer ${
                chat.unread > 0 ? 'bg-[#F5F1E8]/30' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-[#C4A672] to-[#8B7355]">
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
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