import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Settings, MoreVertical, Heart, MessageSquare, Share2, Plus, UserPlus, UserMinus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar } from '../ui/avatar';
import { CreatePost } from './CreatePost';
import { PostDetail } from './PostDetail';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot, collection, query, orderBy, increment, addDoc, serverTimestamp } from 'firebase/firestore';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images: string[];
  createdAt: string;
  reactions: {
    like: number;
    love: number;
    insightful: number;
  };
  userReaction?: 'like' | 'love' | 'insightful';
  commentCount: number;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  joinedAt: string;
  status?: 'pending';
}

interface CommunityDetailsProps {
  userId?: string;
}

export function CommunityDetails({ userId }: CommunityDetailsProps) {
  const { id: communityId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const onBack = () => navigate('/communities');
  const onNavigateToChat = (id: string) => navigate(`/communities/${id}/chat`);

  useEffect(() => {
    const fetchCommunity = async () => {
      setLoading(true);
      try {
        if (!communityId) return;
        const commDoc = await getDoc(doc(db, 'communities', communityId));
        if (commDoc.exists()) {
          const data = commDoc.data();
          setCommunity({ id: commDoc.id, ...data });

          if (userId) {
            setIsAdmin(data.adminId === userId);
            setIsMember(data.members?.includes(userId) || false);
          }
        }

        // Real-time posts
        const postsUnsub = onSnapshot(
          query(collection(db, 'communities', communityId, 'posts'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
          }
        );

        // Real-time members and pending
        const membersUnsub = onSnapshot(
          collection(db, 'communities', communityId, 'members'),
          (snapshot) => {
            const membersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Member));
            setMembers(membersData);
          }
        );

        const pendingUnsub = onSnapshot(
          collection(db, 'communities', communityId, 'pending'),
          (snapshot) => {
            const pendingData = snapshot.docs.map(d => ({ id: d.id, ...d.data(), status: 'pending' } as Member));
            setMembers(prev => [...prev.filter(m => !m.status), ...pendingData]);
          }
        );

        return () => {
          postsUnsub();
          membersUnsub();
          pendingUnsub();
        };
      } catch (err) {
        toast.error('Failed to load community');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunity();
  }, [communityId]);

  const handleJoin = async () => {
    if (!communityId || !auth.currentUser?.uid) return;
    try {
      const commRef = doc(db, 'communities', communityId);
      if (community.privacy === 'private') {
        await updateDoc(commRef, {
          pending: arrayUnion(auth.currentUser.uid)
        });
        toast.success('Join request sent! Waiting for admin approval.');
      } else {
        await updateDoc(commRef, {
          members: arrayUnion(auth.currentUser?.uid),
          memberCount: increment(1)
        });
        setIsMember(true);
        toast.success('Successfully joined the community!');
      }
    } catch (err) {
      toast.error('Failed to join');
    }
  };

  const handleLeave = async () => {
    if (!communityId || !auth.currentUser?.uid) return;
    try {
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        members: arrayRemove(auth.currentUser.uid),
        memberCount: increment(-1)
      });
      setIsMember(false);
      toast.info('You left the community');
    } catch (err) {
      toast.error('Failed to leave');
    }
  };

  const handleReact = async (postId: string, reaction: 'like' | 'love' | 'insightful') => {
    if (!communityId) return;
    try {
      const postRef = doc(db, 'communities', communityId, 'posts', postId);
      // Update reactions in DB - assuming reactions field is a map
      await updateDoc(postRef, {
        [`reactions.${reaction}`]: increment(1),
        userReaction: reaction  // Or handle toggle
      });
      setPosts(prev =>
        prev.map(post => {
          if (post.id !== postId) return post;

          const currentReaction = post.userReaction;
          const reactions = { ...post.reactions };

          // Remove old reaction
          if (currentReaction) {
            reactions[currentReaction]--;
          }

          // Add new reaction or toggle off
          if (currentReaction === reaction) {
            return { ...post, reactions, userReaction: undefined };
          } else {
            reactions[reaction]++;
            return { ...post, reactions, userReaction: reaction };
          }
        })
      );
    } catch (err) {
      toast.error('Failed to react');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!communityId) return;
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'communities', communityId, 'posts', postId));
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleApproveMember = async (memberId: string) => {
    if (!communityId) return;
    try {
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        pending: arrayRemove(memberId),
        members: arrayUnion(memberId),
        memberCount: increment(1)
      });
      setMembers(prev =>
        prev.map(m =>
          m.id === memberId ? { ...m, status: undefined } : m
        )
      );
      toast.success('Member approved');
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!communityId) return;
    try {
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        pending: arrayRemove(memberId)
      });
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.info('Join request rejected');
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const handleKickMember = async (memberId: string) => {
    if (!communityId) return;
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const commRef = doc(db, 'communities', communityId);
        await updateDoc(commRef, {
          members: arrayRemove(memberId),
          memberCount: increment(-1)
        });
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success('Member removed');
      } catch (err) {
        toast.error('Failed to remove');
      }
    }
  };

  const handleCreatePost = async (content: string, images: string[]) => {
    if (!communityId || !userId) return;
    try {
      const newPostData = {
        authorId: userId,
        authorName: 'Current User',  // Fetch real name
        authorAvatar: 'CU',
        content,
        images,
        createdAt: new Date().toISOString(), // Use ISO string for consistency or serverTimestamp if handled
        reactions: { like: 0, love: 0, insightful: 0 },
        commentCount: 0
      };

      const postRef = await addDoc(collection(db, 'communities', communityId, 'posts'), {
        ...newPostData,
        createdAt: serverTimestamp()
      });

      // Optimistic update
      const optimisticPost: Post = {
        id: postRef.id,
        ...newPostData,
        createdAt: new Date().toISOString() // Display local time immediately
      };

      setPosts(prev => [optimisticPost, ...prev]);
      setShowCreatePost(false);
      toast.success('Post published!');
    } catch (err) {
      toast.error('Failed to post');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!community) return <div>Community not found</div>;
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-0">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-[#2C3E50] to-[#34495E]">
        <img
          src={community.coverImage}
          alt={community.name}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </button>

        {/* Community Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl mb-2">{community.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {community.memberCount.toLocaleString()} members
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {community.postsCount} posts
              </span>
              <span>Admin: {community.admin}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6 flex items-center justify-between">
          <div className="flex gap-3">
            {isMember ? (
              <>
                <Button
                  onClick={() => communityId && onNavigateToChat(communityId)}
                  className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Group Chat
                </Button>
                <Button
                  onClick={handleLeave}
                  variant="outline"
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Leave
                </Button>
              </>
            ) : (
              <Button
                onClick={handleJoin}
                className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Join Community
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {community.topics?.map((topic: string) => (
              <Badge key={topic} variant="outline">{topic}</Badge>
            ))}
            {isAdmin && (
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-[#2C3E50] mb-2">About</h3>
          <p className="text-gray-600">{community.description}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="posts" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Posts
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            {isMember && (
              <Button
                onClick={() => setShowCreatePost(true)}
                className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            )}

            {posts.map(post => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                      {post.authorAvatar}
                    </div>
                    <div>
                      <div className="text-[#2C3E50]">{post.authorName}</div>
                      <div className="text-sm text-gray-500">{post.createdAt}</div>
                    </div>
                  </div>
                  {(isAdmin || post.authorId === userId) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Post Images */}
                {post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {post.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Post"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReact(post.id, 'like')}
                    className={`flex items-center gap-2 text-sm transition-colors ${post.userReaction === 'like'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                      }`}
                  >
                    👍 {post.reactions.like}
                  </button>
                  <button
                    onClick={() => handleReact(post.id, 'love')}
                    className={`flex items-center gap-2 text-sm transition-colors ${post.userReaction === 'love'
                      ? 'text-red-600'
                      : 'text-gray-600 hover:text-red-600'
                      }`}
                  >
                    ❤️ {post.reactions.love}
                  </button>
                  <button
                    onClick={() => handleReact(post.id, 'insightful')}
                    className={`flex items-center gap-2 text-sm transition-colors ${post.userReaction === 'insightful'
                      ? 'text-yellow-600'
                      : 'text-gray-600 hover:text-yellow-600'
                      }`}
                  >
                    💡 {post.reactions.insightful}
                  </button>
                  <button
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#C4A672] transition-colors ml-auto"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {post.commentCount} comments
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-600 mb-2">No posts yet</h3>
                <p className="text-gray-500">Be the first to start a discussion!</p>
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            {isAdmin && members.some(m => m.status === 'pending') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                <h3 className="text-[#2C3E50] mb-3">Pending Join Requests</h3>
                {members
                  .filter(m => m.status === 'pending')
                  .map(member => (
                    <div key={member.id} className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                          {member.avatar}
                        </div>
                        <span className="text-[#2C3E50]">{member.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveMember(member.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectMember(member.id)}
                          className="text-red-600 border-red-200"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y">
              {members
                .filter(m => !m.status)
                .map(member => (
                  <div key={member.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white text-lg">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="text-[#2C3E50] flex items-center gap-2">
                          {member.name}
                          {member.role === 'admin' && (
                            <Badge className="bg-[#C4A672] text-white">Admin</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {isAdmin && member.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleKickMember(member.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          isAdmin={isAdmin}
          userId={userId || ''}
        />
      )}
    </div>
  );
}
