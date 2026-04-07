import { useState, useEffect } from 'react';
import { MessageCircle, X, Search, Users, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

export function GlobalChatWidget() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalUnread, setTotalUnread] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            setChats([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const privateQuery = query(
            collection(db, 'privateChats'),
            where('participants', 'array-contains', user.uid),
            orderBy('lastMessageTimestamp', 'desc')
        );

        // Changed to 'communities' and removed orderBy to avoid missing index/field issues on existing data
        const groupQuery = query(
            collection(db, 'communities'),
            where('members', 'array-contains', user.uid)
        );

        const unsubPrivate = onSnapshot(privateQuery, (snap) => {
            const pChats = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'private' }));
            updateChats(pChats, 'private');
        });

        const unsubGroup = onSnapshot(groupQuery, (snap) => {
            const gChats = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'group' }));
            updateChats(gChats, 'group');
        });

        let privateData: any[] = [];
        let groupData: any[] = [];

        const updateChats = (newData: any[], type: 'private' | 'group') => {
            if (type === 'private') privateData = newData;
            if (type === 'group') groupData = newData;

            const combined = [...privateData, ...groupData].sort((a, b) => {
                const tA = a.lastMessageTimestamp?.toDate ? a.lastMessageTimestamp.toDate().getTime() : 0;
                const tB = b.lastMessageTimestamp?.toDate ? b.lastMessageTimestamp.toDate().getTime() : 0;
                return tB - tA;
            });

            setChats(combined);
            setTotalUnread(combined.reduce((sum, c) => sum + (c.unreadCount || 0), 0));
            setLoading(false);
        };

        return () => {
            unsubPrivate();
            unsubGroup();
        };
    }, [user]);

    const filteredChats = chats.filter(chat =>
        chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleChatClick = (chat: any) => {
        setIsOpen(false);
        if (chat.type === 'private') {
            const otherId = chat.participants.find((p: string) => p !== user?.uid);
            navigate('/chat', {
                state: {
                    otherUser: {
                        id: otherId,
                        name: chat.name,
                        avatar: chat.avatar
                    }
                }
            });
        } else {
            navigate(`/communities/${chat.id}/chat`);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        className="h-14 w-14 rounded-full bg-[#C4A672] hover:bg-[#8B7355] shadow-xl relative"
                    >
                        <MessageCircle className="w-7 h-7 text-white" />
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 mr-6 mb-2 rounded-xl shadow-2xl border-gray-200" align="end" side="top">
                    <div className="bg-[#2C3E50] p-4 rounded-t-xl text-white flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">Messages</h3>
                            <p className="text-xs text-white/70">
                                {totalUnread > 0 ? `${totalUnread} unread` : 'No new messages'}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10 h-8 w-8">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <ScrollArea className="h-[400px]">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400 text-sm">Loading chats...</div>
                        ) : filteredChats.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                                <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                                <p>No conversations found</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {filteredChats.map(chat => (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleChatClick(chat)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar className="w-10 h-10 border border-gray-200">
                                                <div className="w-full h-full flex items-center justify-center bg-[#F5F1E8] text-[#C4A672] font-semibold">
                                                    {chat.avatar ? (
                                                        <img src={chat.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        chat.name?.[0]?.toUpperCase() || 'C'
                                                    )}
                                                </div>
                                            </Avatar>
                                            {chat.type === 'group' && (
                                                <div className="absolute -bottom-1 -right-1 bg-[#2C3E50] rounded-full p-0.5 border-2 border-white">
                                                    <Users className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h4 className={`text-sm text-[#2C3E50] truncate pr-2 ${chat.unread > 0 ? 'font-bold' : 'font-medium'}`}>
                                                    {chat.name || 'Unknown Chat'}
                                                </h4>
                                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                    {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                                                </span>
                                            </div>
                                            <p className={`text-xs truncate ${chat.unread > 0 ? 'text-[#2C3E50] font-medium' : 'text-gray-500'}`}>
                                                {chat.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                        {chat.unread > 0 && (
                                            <div className="w-2 h-2 bg-[#C4A672] rounded-full flex-shrink-0 ml-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
                        <Button variant="link" size="sm" onClick={() => { setIsOpen(false); navigate('/dashboard/chats'); }} className="text-[#C4A672] h-auto p-0 text-xs">
                            View All Messages
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
