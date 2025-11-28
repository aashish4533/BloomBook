<<<<<<< HEAD
// Updated src/components/Communities/CommunitiesBrowse.tsx
import { useState, useEffect } from 'react';
=======
import { useState } from 'react';
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
import { Search, Filter, Grid, List, Plus, Users, Lock, Globe, MessageCircle, TrendingUp } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
<<<<<<< HEAD
import { toast } from 'sonner';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
=======
import { toast } from 'sonner@2.0.3';
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249

interface Post {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  admin: string;
  privacy: 'public' | 'private';
  topic: string;
  image: string;
  location?: string;
  isMember: boolean;
  isPending?: boolean;
  recentPosts: Post[];
  postsCount: number;
}

<<<<<<< HEAD
=======
const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Science Fiction Lovers',
    description: 'Discuss classic and modern sci-fi books, from Asimov to Liu Cixin. Share recommendations, theories, and fan art.',
    memberCount: 1234,
    admin: 'Sarah Johnson',
    privacy: 'public',
    topic: 'Fiction',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400',
    location: 'San Francisco, CA',
    isMember: false,
    recentPosts: [
      { id: '1', authorName: 'John Doe', content: 'Just finished Dune! What an epic...', timestamp: '2h ago' },
      { id: '2', authorName: 'Jane Smith', content: 'Looking for recommendations similar to Foundation', timestamp: '5h ago' }
    ],
    postsCount: 234
  },
  {
    id: '2',
    name: 'Business Book Club',
    description: 'Professional development through reading and discussion. Monthly book selections, expert discussions, and networking.',
    memberCount: 856,
    admin: 'Michael Chen',
    privacy: 'public',
    topic: 'Business',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    location: 'New York, NY',
    isMember: true,
    recentPosts: [
      { id: '1', authorName: 'Alex Brown', content: 'This month: "Atomic Habits" - Who\'s in?', timestamp: '1h ago' },
      { id: '2', authorName: 'Lisa Wang', content: 'Great discussion last week!', timestamp: '1d ago' }
    ],
    postsCount: 156
  },
  {
    id: '3',
    name: 'Fantasy Realm',
    description: 'Epic tales, magical worlds, and dragon adventures await. From Tolkien to Sanderson and beyond.',
    memberCount: 2103,
    admin: 'Emma Williams',
    privacy: 'private',
    topic: 'Fantasy',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    location: 'Online',
    isMember: false,
    recentPosts: [
      { id: '1', authorName: 'Tom Green', content: 'Stormlight Archive book 5 hype!', timestamp: '30m ago' }
    ],
    postsCount: 567
  },
  {
    id: '4',
    name: 'Academic Exchange',
    description: 'Share textbooks, notes, and study resources. Help each other succeed in academics.',
    memberCount: 567,
    admin: 'David Park',
    privacy: 'public',
    topic: 'Education',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    location: 'Boston, MA',
    isMember: false,
    recentPosts: [
      { id: '1', authorName: 'Student A', content: 'Looking for Calculus III notes', timestamp: '3h ago' },
      { id: '2', authorName: 'Student B', content: 'Selling my old chemistry textbook', timestamp: '6h ago' }
    ],
    postsCount: 89
  },
  {
    id: '5',
    name: 'Mystery & Thriller Enthusiasts',
    description: 'Solve mysteries together, discuss plot twists, and find your next page-turner.',
    memberCount: 945,
    admin: 'Rachel Adams',
    privacy: 'public',
    topic: 'Mystery',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
    isMember: true,
    recentPosts: [
      { id: '1', authorName: 'Mike R', content: 'The Silent Patient - mind blown!', timestamp: '4h ago' }
    ],
    postsCount: 312
  },
  {
    id: '6',
    name: 'Poetry Corner',
    description: 'Share, discuss, and create poetry. From classics to contemporary works.',
    memberCount: 423,
    admin: 'Olivia Martinez',
    privacy: 'public',
    topic: 'Poetry',
    image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400',
    isMember: false,
    recentPosts: [
      { id: '1', authorName: 'Poet1', content: 'Just wrote a new piece, feedback welcome!', timestamp: '2h ago' }
    ],
    postsCount: 178
  }
];

>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
interface CommunitiesBrowseProps {
  onNavigateToDetail: (communityId: string) => void;
  onNavigateToCreate: () => void;
  isLoggedIn: boolean;
}

export function CommunitiesBrowse({ onNavigateToDetail, onNavigateToCreate, isLoggedIn }: CommunitiesBrowseProps) {
<<<<<<< HEAD
  const [communities, setCommunities] = useState<Community[]>([]);
=======
  const [communities, setCommunities] = useState(mockCommunities);
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [topicFilter, setTopicFilter] = useState('all');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('members');
  const [showFilters, setShowFilters] = useState(false);
<<<<<<< HEAD
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'communities'), async (snapshot) => {
      const data = await Promise.all(snapshot.docs.map(async (d) => {
        const commData = { id: d.id, ...d.data() } as Community;
        // Fetch recent posts (last 2)
        const postsQ = query(
          collection(db, 'communities', d.id, 'posts'),
          orderBy('timestamp', 'desc'),
          limit(2)
        );
        const postsSnap = await getDocs(postsQ);
        commData.recentPosts = postsSnap.docs.map(p => ({ id: p.id, ...p.data() } as Post));
        commData.postsCount = postsSnap.size;  // Or use a counter

        return commData;
      }));
      setCommunities(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = async (communityId: string, privacy: 'public' | 'private', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn || !user) {
=======

  const handleJoin = (communityId: string, privacy: 'public' | 'private', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
      toast.error('Please login to join communities');
      return;
    }

<<<<<<< HEAD
    const commRef = doc(db, 'communities', communityId);

    try {
      if (privacy === 'private') {
        await updateDoc(commRef, {
          pending: arrayUnion({ userId: user.uid, name: user.displayName || 'User', timestamp: new Date() })
        });
        toast.success('Join request sent! Waiting for admin approval.');
      } else {
        await updateDoc(commRef, {
          members: arrayUnion({ userId: user.uid, name: user.displayName || 'User', timestamp: new Date() }),
          memberCount: increment(1)
        });
        toast.success('Successfully joined the community!');
      }
    } catch (err) {
      toast.error('Failed to join');
      console.error(err);
    }
  };

  const handleLeave = async (communityId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const commRef = doc(db, 'communities', communityId);

    try {
      await updateDoc(commRef, {
        members: arrayRemove({ userId: user.uid }),
        memberCount: increment(-1)
      });
      toast.info('You left the community');
    } catch (err) {
      toast.error('Failed to leave');
      console.error(err);
    }
=======
    if (privacy === 'private') {
      setCommunities(prev =>
        prev.map(c =>
          c.id === communityId ? { ...c, isPending: true } : c
        )
      );
      toast.success('Join request sent! Waiting for admin approval.');
    } else {
      setCommunities(prev =>
        prev.map(c =>
          c.id === communityId
            ? { ...c, isMember: true, memberCount: c.memberCount + 1 }
            : c
        )
      );
      toast.success('Successfully joined the community!');
    }
  };

  const handleLeave = (communityId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommunities(prev =>
      prev.map(c =>
        c.id === communityId
          ? { ...c, isMember: false, isPending: false, memberCount: c.memberCount - 1 }
          : c
      )
    );
    toast.info('You left the community');
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
  };

  // Filter and sort communities
  const filteredCommunities = communities
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTopic = topicFilter === 'all' || c.topic === topicFilter;
      const matchesPrivacy = privacyFilter === 'all' || c.privacy === privacyFilter;
      return matchesSearch && matchesTopic && matchesPrivacy;
    })
    .sort((a, b) => {
      if (sortBy === 'members') return b.memberCount - a.memberCount;
      if (sortBy === 'posts') return b.postsCount - a.postsCount;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

<<<<<<< HEAD
  const topics = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Romance', 'Thriller', 'Horror', 'Biography', 'History',
    'Science', 'Technology', 'Business', 'Self-Help', 'Art',
    'Poetry', 'Drama', 'Education', 'Religion', 'Philosophy'];
=======
  const topics = ['Fiction', 'Business', 'Fantasy', 'Education', 'Mystery', 'Poetry', 'Science', 'Art'];
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl mb-2">Book Communities</h1>
              <p className="text-white/90">Connect with readers who share your interests</p>
            </div>
            {isLoggedIn && (
              <Button
                onClick={onNavigateToCreate}
                size="lg"
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Community
              </Button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search communities by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-14 text-lg bg-white text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="members">Most Members</SelectItem>
                <SelectItem value="posts">Most Active</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-gray-600">
              {filteredCommunities.length} communities
            </div>
          </div>

          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Topic</label>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics.map(topic => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Privacy</label>
                <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="public">Public Only</SelectItem>
                    <SelectItem value="private">Private Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTopicFilter('all');
                    setPrivacyFilter('all');
                    setSearchQuery('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Communities Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => onNavigateToDetail(community.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-[#C4A672] to-[#8B7355] overflow-hidden">
                  <img
                    src={community.image}
                    alt={community.name}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700 border-0">
                      {community.privacy === 'public' ? (
                        <><Globe className="w-3 h-3 mr-1" /> Public</>
                      ) : (
                        <><Lock className="w-3 h-3 mr-1" /> Private</>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-[#2C3E50] text-xl mb-2 group-hover:text-[#C4A672] transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {community.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{community.memberCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{community.postsCount}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {community.topic}
                    </Badge>
                  </div>

                  {/* Recent Posts Preview */}
                  {community.recentPosts.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="text-xs text-gray-500 mb-2">Recent Activity:</div>
                      {community.recentPosts.slice(0, 2).map((post) => (
                        <div key={post.id} className="text-sm text-gray-700 mb-1 truncate">
                          <span className="text-[#C4A672]">{post.authorName}:</span> {post.content}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    Admin: {community.admin}
                    {community.location && ` • ${community.location}`}
                  </div>

                  {/* Actions */}
                  {community.isPending ? (
                    <Button
                      disabled
                      className="w-full bg-gray-300 text-gray-600 cursor-not-allowed"
                      size="sm"
                    >
                      Pending Approval
                    </Button>
                  ) : community.isMember ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToDetail(community.id);
                        }}
                        className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                        size="sm"
                      >
                        View
                      </Button>
                      <Button
                        onClick={(e) => handleLeave(community.id, e)}
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 border-red-200"
                        size="sm"
                      >
                        Leave
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={(e) => handleJoin(community.id, community.privacy, e)}
                      className="w-full bg-[#2C3E50] hover:bg-[#1a252f] text-white"
                      size="sm"
                    >
                      {community.privacy === 'private' ? 'Request to Join' : 'Join Community'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-4">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => onNavigateToDetail(community.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={community.image}
                      alt={community.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-[#2C3E50] text-xl mb-1 group-hover:text-[#C4A672] transition-colors">
                          {community.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <Badge variant="secondary" className="bg-gray-100">
                            {community.privacy === 'public' ? (
                              <><Globe className="w-3 h-3 mr-1" /> Public</>
                            ) : (
                              <><Lock className="w-3 h-3 mr-1" /> Private</>
                            )}
                          </Badge>
                          <Badge variant="outline">{community.topic}</Badge>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {community.memberCount.toLocaleString()} members
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {community.postsCount} posts
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="ml-4">
                        {community.isPending ? (
                          <Button
                            disabled
                            className="bg-gray-300 text-gray-600 cursor-not-allowed"
                            size="sm"
                          >
                            Pending
                          </Button>
                        ) : community.isMember ? (
                          <Button
                            onClick={(e) => handleLeave(community.id, e)}
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 border-red-200"
                            size="sm"
                          >
                            Leave
                          </Button>
                        ) : (
                          <Button
                            onClick={(e) => handleJoin(community.id, community.privacy, e)}
                            className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
                            size="sm"
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3">
                      {community.description}
                    </p>

                    <div className="text-sm text-gray-500">
                      Admin: {community.admin}
                      {community.location && ` • ${community.location}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredCommunities.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl text-gray-600 mb-2">No communities found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
            <Button onClick={() => {
              setSearchQuery('');
              setTopicFilter('all');
              setPrivacyFilter('all');
            }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 145c4cd5555d05ec1f1443f321d633c589c8e249
