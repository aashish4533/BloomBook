import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Plus, Users, Lock, Globe, MessageCircle, TrendingUp } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, orderBy, limit, increment } from 'firebase/firestore';

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

interface CommunitiesBrowseProps {
  onNavigateToDetail: (communityId: string) => void;
  onNavigateToCreate: () => void;
  isLoggedIn: boolean;
}

export function CommunitiesBrowse({ onNavigateToDetail, onNavigateToCreate, isLoggedIn }: CommunitiesBrowseProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [topicFilter, setTopicFilter] = useState('all');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('members');
  const [showFilters, setShowFilters] = useState(false);
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
      toast.error('Please login to join communities');
      return;
    }

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

    if (!user) return;

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

  const topics = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
    'Romance', 'Thriller', 'Horror', 'Biography', 'History',
    'Science', 'Technology', 'Business', 'Self-Help', 'Art',
    'Poetry', 'Drama', 'Education', 'Religion', 'Philosophy'];

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
}
