import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { CreateCommunity } from './CreateCommunity';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

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
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const onBack = () => navigate('/communities');
  const onNavigateToChat = (id: string) => navigate(`/communities/${id}/chat`);

  // Define logic functions first
  const handleDeletePost = (postId: string) => {
    setDeletePostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!communityId || !deletePostId) return;
    try {
      await deleteDoc(doc(db, 'communities', communityId, 'posts', deletePostId));

      setPosts(prev => prev.filter(p => p.id !== deletePostId));

      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        postsCount: increment(-1)
      });

      toast.success('Post deleted');
      setDeletePostId(null);
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [location]);

  useEffect(() => {
    if (!communityId) return;

    setLoading(true);

    const commUnsub = onSnapshot(doc(db, 'communities', communityId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setCommunity({ id: docSnapshot.id, ...data });

        const currentUser = auth.currentUser;
        if (currentUser) {
          setIsAdmin(data.adminId === currentUser.uid);
          setIsMember(data.members?.includes(currentUser.uid) || false);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching community:", error);
      setLoading(false);
    });

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

    return () => {
      commUnsub();
      postsUnsub();
      membersUnsub();
      pendingUnsub();
    };
  }, [communityId]);

  const handleJoin = async () => {
    if (!communityId || !auth.currentUser?.uid) return;
    const user = auth.currentUser;

    try {
      if (community.privacy === 'private') {
        const pendingRef = doc(db, 'communities', communityId, 'pending', user.uid);
        await setDoc(pendingRef, {
          id: user.uid,
          name: user.displayName || 'User',
          avatar: user.photoURL || 'U',
          joinedAt: serverTimestamp(),
          role: 'member'
        });
        toast.success('Join request sent');
      } else {
        const commRef = doc(db, 'communities', communityId);
        await updateDoc(commRef, {
          members: arrayUnion(user.uid),
          memberCount: increment(1)
        });

        await setDoc(doc(db, 'communities', communityId, 'members', user.uid), {
          id: user.uid,
          name: user.displayName || 'User',
          role: 'member',
          joinedAt: serverTimestamp(),
          avatar: user.photoURL || 'U'
        });
        toast.success('Joined community');
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
      await deleteDoc(doc(db, 'communities', communityId, 'members', auth.currentUser.uid));
      toast.success('Left community');
      navigate('/communities');
    } catch (err) {
      toast.error('Failed to leave');
    }
  };

  const handleDeleteCommunity = async () => {
    if (!isAdmin || !communityId) return;
    if (!confirm('Are you sure you want to delete this community?')) return;

    try {
      await deleteDoc(doc(db, 'communities', communityId));
      toast.success('Community deleted');
      navigate('/communities');
    } catch (err) {
      toast.error('Failed to delete community');
    }
  };

  const handleCreatePost = async (content: string, images: string[]) => {
    if (!communityId || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'communities', communityId, 'posts'), {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'User',
        authorAvatar: auth.currentUser.photoURL || 'U',
        content,
        images,
        createdAt: serverTimestamp(),
        likes: 0,
        commentCount: 0,
        reactions: { like: 0, love: 0, insightful: 0 }
      });

      const commRef = doc(db, 'communities', communityId);
      await updateDoc(commRef, {
        postsCount: increment(1)
      });

      toast.success('Post created successfully');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  // Logic for displaying content
  if (showCreatePost) {
    return (
      <CreatePost
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />
    );
  }

  if (isEditing) {
    return (
      <CreateCommunity
        onBack={() => setIsEditing(false)}
        onSuccess={() => setIsEditing(false)}
        userId={auth.currentUser?.uid || ''}
        userName={auth.currentUser?.displayName || 'User'}
        initialData={community}
        isEditing={true}
        communityId={communityId}
      />
    );
  }

  if (!community) return <div>Community not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-0">
      <div className="relative h-64 bg-gradient-to-r from-[#2C3E50] to-[#34495E]">
        <img
          src={community.coverImage}
          alt={community.name}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <div className="w-10 h-10 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5" />
          </div>
        </button>

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
              <span>Admin: {community.adminName || community.admin}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
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
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Community
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteCommunity}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="posts" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Posts
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Members ({members.length})
            </TabsTrigger>
          </TabsList>

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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                      {post.authorAvatar || 'U'}
                    </div>
                    <div>
                      <div className="text-[#2C3E50]">{post.authorName}</div>
                      <div className="text-sm text-gray-500">{post.createdAt}</div>
                    </div>
                  </div>
                  {(isAdmin || post.authorId === auth.currentUser?.uid) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                <div onClick={() => setSelectedPost(post)} className="cursor-pointer">
                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {post.images && post.images.length > 0 && (
                    <div className="mb-4">
                      <img
                        src={post.images[0]}
                        alt="Post attachment"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-gray-500">
                    <button className="flex items-center gap-2 hover:text-[#C4A672] transition-colors">
                      <Heart className="w-5 h-5" />
                      <span>{post.reactions?.like || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#C4A672] transition-colors">
                      <MessageSquare className="w-5 h-5" />
                      <span>{post.commentCount || 0} comments</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#C4A672] transition-colors ml-auto">
                      <Share2 className="w-5 h-5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="members">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-3">
                  <Avatar className="w-10 h-10 bg-[#C4A672]">
                    <div className="w-full h-full flex items-center justify-center text-white font-medium">
                      {member.avatar || 'U'}
                    </div>
                  </Avatar>
                  <div>
                    <div className="font-medium text-[#2C3E50] border-none">{member.name}</div>
                    <div className="text-xs text-gray-500 border-none capitalize">{member.role}</div>
                  </div>
                  {isAdmin && member.id !== auth.currentUser?.uid && (
                    <Button variant="ghost" size="sm" className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50">
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          isAdmin={isAdmin}
          userId={auth.currentUser?.uid || ''}
          communityId={communityId}
        />
      )}

      <AlertDialog open={!!deletePostId} onOpenChange={(open: boolean) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the post and all its comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePost} className="bg-red-600 hover:bg-red-700 text-white border-none">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
