import { useState } from 'react';
import { Users, MessageCircle, TrendingUp, Calendar, Search, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface UserCommunitiesProps {
  onNavigateToCommunity?: (communityId: string) => void;
  onNavigateToCreate?: () => void;
}

export function UserCommunities({ onNavigateToCommunity, onNavigateToCreate }: UserCommunitiesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'joined' | 'created'>('all');

  // Mock data - in real app, this would come from state/API
  const myCommunities = [
    {
      id: '1',
      name: 'Science Fiction Lovers',
      description: 'Discuss the latest sci-fi novels and classics',
      members: 1250,
      posts: 458,
      unreadMessages: 5,
      role: 'member',
      lastActive: '2 hours ago',
      image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400',
      category: 'Fiction',
    },
    {
      id: '2',
      name: 'Mystery & Thriller Club',
      description: 'For fans of suspense and mystery novels',
      members: 890,
      posts: 324,
      unreadMessages: 12,
      role: 'member',
      lastActive: '1 day ago',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      category: 'Mystery',
    },
    {
      id: '3',
      name: 'Classic Literature',
      description: 'Deep dives into timeless classics',
      members: 2100,
      posts: 892,
      unreadMessages: 0,
      role: 'admin',
      lastActive: '5 hours ago',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
      category: 'Classics',
    },
    {
      id: '4',
      name: 'Fantasy Realm',
      description: 'Epic adventures and magical worlds',
      members: 1580,
      posts: 623,
      unreadMessages: 3,
      role: 'member',
      lastActive: '3 hours ago',
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
      category: 'Fantasy',
    },
  ];

  const suggestedCommunities = [
    {
      id: '5',
      name: 'Book Club Enthusiasts',
      description: 'Monthly book discussions and reading challenges',
      members: 3200,
      posts: 1254,
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
      category: 'General',
    },
    {
      id: '6',
      name: 'Non-Fiction Nerds',
      description: 'Biographies, history, and educational reads',
      members: 956,
      posts: 487,
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      category: 'Non-Fiction',
    },
  ];

  const filteredCommunities = myCommunities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
                         (activeFilter === 'created' && community.role === 'admin') ||
                         (activeFilter === 'joined' && community.role === 'member');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl text-[#2C3E50] mb-2">My Communities</h2>
          <p className="text-gray-600">Connect with fellow book lovers</p>
        </div>
        <Button
          onClick={onNavigateToCreate}
          className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('all')}
            className={activeFilter === 'all' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'joined' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('joined')}
            className={activeFilter === 'joined' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
          >
            Joined
          </Button>
          <Button
            variant={activeFilter === 'created' ? 'default' : 'outline'}
            onClick={() => setActiveFilter('created')}
            className={activeFilter === 'created' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
          >
            Created
          </Button>
        </div>
      </div>

      {/* My Communities */}
      <div className="space-y-4">
        <h3 className="text-lg text-[#2C3E50]">Joined Communities ({filteredCommunities.length})</h3>
        {filteredCommunities.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No communities found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-[#C4A672] transition-all hover:shadow-lg cursor-pointer overflow-hidden"
                onClick={() => onNavigateToCommunity?.(community.id)}
              >
                <div className="flex gap-4 p-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl overflow-hidden">
                      <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
                    </div>
                    {community.unreadMessages > 0 && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                        {community.unreadMessages}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-[#2C3E50] truncate">{community.name}</h4>
                      <Badge variant={community.role === 'admin' ? 'default' : 'secondary'} className={community.role === 'admin' ? 'bg-[#C4A672]' : ''}>
                        {community.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{community.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{community.members.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{community.posts}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{community.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Communities */}
      {activeFilter === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg text-[#2C3E50]">Suggested for You</h3>
            <Button variant="ghost" className="text-[#C4A672] hover:text-[#8B7355]">
              View All
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {suggestedCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-gradient-to-br from-[#F5F1E8] to-white rounded-xl p-4 hover:shadow-lg transition-all border border-[#C4A672]/20"
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl overflow-hidden flex-shrink-0">
                    <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[#2C3E50] mb-1 truncate">{community.name}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{community.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{community.members.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{community.posts}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToCommunity?.(community.id);
                        }}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
