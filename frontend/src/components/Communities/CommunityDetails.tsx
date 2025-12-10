import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageCircle, Settings, MoreVertical, Heart, MessageSquare, Share2, Plus, UserPlus, UserMinus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { CreatePost } from './CreatePost';
import { PostDetail } from './PostDetail';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot, collection, query, orderBy, increment, addDoc, serverTimestamp, deleteField, setDoc } from 'firebase/firestore';

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

// Helper to safely format timestamps
const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp;
  if (timestamp?.toDate) return timestamp.toDate().toLocaleString();
  if (timestamp?.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
  return '';
};

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
    if (!communityId) return;

    setLoading(true);

    // 1. Real-time listener for the Community Document
    // This ensures that if you join/leave, the UI updates instantly
    const commUnsub = onSnapshot(doc(db, 'communities', communityId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setCommunity({ id: docSnapshot.id, ...data });

        // Check membership using the current authenticated user
        const currentUser = auth.currentUser;
        if (currentUser) {
          setIsAdmin(data.adminId === currentUser.uid);
          // Check if the 'members' array exists and contains your ID
          setIsMember(data.members?.includes(currentUser.uid) || false);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching community:", error);
      // toast.error('Failed to load community'); // Optional: uncomment if you want errors shown
      setLoading(false);
    });

    // 2. Real-time posts listener (Keep this as is)
    const postsUnsub = onSnapshot(
      query(collection(db, 'communities', communityId, 'posts'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setPosts(snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: formatTimestamp(data.createdAt)
          } as Post;
        }));
      }
    );

    // 3. Real-time members listener (Keep this as is)
    const membersUnsub = onSnapshot(
      collection(db, 'communities', communityId, 'members'),
      (snapshot) => {
        const membersData = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            joinedAt: formatTimestamp(data.joinedAt)
          } as Member;
        });
        setMembers(membersData);
      }
    );

    // 4. Pending members listener (Keep this as is)
    const pendingUnsub = onSnapshot(
      collection(db, 'communities', communityId, 'pending'),
      (snapshot) => {
        const pendingData = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            joinedAt: formatTimestamp(data.joinedAt),
            status: 'pending'
          } as Member;
        });
        setMembers(prev => [...prev.filter(m => !m.status), ...pendingData]);
      }
    );


    // Cleanup listeners when leaving the page
    return () => {
      commUnsub();
      postsUnsub();
      membersUnsub();
      pendingUnsub();
    };
  }, [communityId]); // We only need to restart if the community ID changes

  const handleJoin = async () => {
    if (!communityId || !auth.currentUser?.uid) return;
    const user = auth.currentUser;
    try {
      const commRef = doc(db, 'communities', communityId);
      const timestamp = new Date().toISOString();

      if (community.privacy === 'private') {
        // Add to Pending Subcollection
        await setDoc(doc(db, 'communities', communityId, 'pending', user.uid), {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          avatar: user.photoURL || 'CU',
          joinedAt: timestamp
        });
        // Maintain Array for quick checks
        await updateDoc(commRef, {
          pending: arrayUnion(user.uid)
        });
        toast.success('Join request sent! Waiting for admin approval.');
      } else {
        // Add to Members Subcollection
        await setDoc(doc(db, 'communities', communityId, 'members', user.uid), {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          avatar: user.photoURL || 'CU',
          role: 'member',
          joinedAt: timestamp
        });
        // Maintain Array & Count
        await updateDoc(commRef, {
          members: arrayUnion(user.uid),
          memberCount: increment(1)
        });
        setIsMember(true);
        toast.success('Successfully joined the community!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to join');
    }
  };

  const handleLeave = async () => {
    if (!communityId || !auth.currentUser?.uid) return;
    try {
      const commRef = doc(db, 'communities', communityId);
      // Remove from Subcollection
      await deleteDoc(doc(db, 'communities', communityId, 'members', auth.currentUser.uid));

      // Remove from Array & Count
      await updateDoc(commRef, {
        members: arrayRemove(auth.currentUser.uid),
        memberCount: increment(-1)
      });
      setIsMember(false);
      toast.info('You left the community');
      navigate('/communities');
    } catch (err) {
      console.error(err);
      toast.error('Failed to leave');
    }
  };

  const handleReact = async (postId: string, reaction: 'like' | 'love' | 'insightful') => {
    if (!communityId) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const postRef = doc(db, 'communities', communityId, 'posts', postId);
      const currentReaction = post.userReaction;

      if (currentReaction === reaction) {
        // Toggle OFF
        await updateDoc(postRef, {
          [`reactions.${reaction}`]: increment(-1),
          userReaction: deleteField()
        });
      } else {
        // Swap or Add
        const batchUpdates: any = {
          [`reactions.${reaction}`]: increment(1),
          userReaction: reaction
        };
        if (currentReaction) {
          batchUpdates[`reactions.${currentReaction}`] = increment(-1);
        }
        await updateDoc(postRef, batchUpdates);
      }

      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;

          const reactions = { ...p.reactions };

          // Toggle Off
          if (p.userReaction === reaction) {
            reactions[reaction]--;
            return { ...p, reactions, userReaction: undefined };
          }

          // Remove old
          if (p.userReaction) {
            reactions[p.userReaction]--;
          }

          // Add new
          reactions[reaction]++;
          return { ...p, reactions, userReaction: reaction };
        })
      );
    } catch (err) {
      console.error(err);
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
      // 1. Get Member details explicitly if needed, but we can just use defaults + ID
      // However, best to copy from pending doc if we want 100% data fidelity.
      // For now, assuming basic info is sufficient or reading from pending doc.
      const pendingDocRef = doc(db, 'communities', communityId, 'pending', memberId);
      const pendingSnap = await getDoc(pendingDocRef);
      const pendingData = pendingSnap.exists() ? pendingSnap.data() : { name: 'Unknown', avatar: 'U' };

      const timestamp = new Date().toISOString();

      // 2. Move to Members Subcollection
      await setDoc(doc(db, 'communities', communityId, 'members', memberId), {
        ...pendingData,
        role: 'member',
        joinedAt: timestamp,
        status: null // Remove status
      });

      // 3. Remove from Pending Subcollection
      await deleteDoc(pendingDocRef);

      // 4. Update Parent Arrays
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        pending: arrayRemove(memberId),
        members: arrayUnion(memberId),
        memberCount: increment(1)
      });

      // 5. Create Notification
      await addDoc(collection(db, 'notifications'), {
        userId: memberId,
        type: 'community_approved',
        title: 'Community Join Request Approved',
        message: `Your request to join "${community.name}" has been approved!`,
        link: `/communities/${communityId}`,
        read: false,
        createdAt: serverTimestamp()
      });

      setMembers(prev =>
        prev.map(m =>
          m.id === memberId ? { ...m, status: undefined } : m
        )
      );
      toast.success('Member approved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve');
    }
  };

  const handleRejectMember = async (memberId: string) => {
    if (!communityId) return;
    try {
      // 1. Remove from Pending Subcollection
      await deleteDoc(doc(db, 'communities', communityId, 'pending', memberId));

      // 2. Update Parent Array
      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        pending: arrayRemove(memberId)
      });

      // 3. Create Notification
      await addDoc(collection(db, 'notifications'), {
        userId: memberId,
        type: 'community_rejected',
        title: 'Community Join Request Rejected',
        message: `Your request to join "${community.name}" was declined.`,
        read: false,
        createdAt: serverTimestamp()
      });

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.info('Join request rejected');
    } catch (err) {
      console.error(err);
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
        authorName: auth.currentUser?.displayName || 'Anonymous',
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast.info('Edit functionality coming soon')}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Community
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this community?')) {
                        toast.error('Delete functionality coming soon');
                      }
                    }}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Community
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-[#2C3E50] mb-2">About</h3>
          <p className="text-gray-600">{community.description || community.desc || community.about || "No description available."}</p>
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
