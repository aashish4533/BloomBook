import { useState } from 'react';
import { X, Heart, ThumbsUp, Lightbulb, MessageSquare, Send, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  userLiked: boolean;
  replies: Comment[];
}

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

interface PostDetailProps {
  post: Post;
  onClose: () => void;
  isAdmin: boolean;
  userId: string;
}

export function PostDetail({ post, onClose, isAdmin, userId }: PostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      authorId: 'user2',
      authorName: 'Alice Reader',
      authorAvatar: 'AR',
      content: 'Great post! I absolutely love Dune too. Have you read the sequels?',
      createdAt: '1 hour ago',
      likes: 5,
      userLiked: false,
      replies: [
        {
          id: '1-1',
          authorId: 'user1',
          authorName: 'John Doe',
          authorAvatar: 'JD',
          content: 'Yes! Just started Dune Messiah. It\'s quite different but still amazing.',
          createdAt: '45 minutes ago',
          likes: 2,
          userLiked: false,
          replies: []
        }
      ]
    },
    {
      id: '2',
      authorId: 'user3',
      authorName: 'Bob Scifi',
      authorAvatar: 'BS',
      content: 'The worldbuilding is definitely top tier. Frank Herbert was a genius!',
      createdAt: '30 minutes ago',
      likes: 3,
      userLiked: true,
      replies: []
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      authorId: userId,
      authorName: 'Current User',
      authorAvatar: 'CU',
      content: newComment,
      createdAt: 'Just now',
      likes: 0,
      userLiked: false,
      replies: []
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    toast.success('Comment added');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim()) return;

    const reply: Comment = {
      id: `${commentId}-${Date.now()}`,
      authorId: userId,
      authorName: 'Current User',
      authorAvatar: 'CU',
      content: replyContent,
      createdAt: 'Just now',
      likes: 0,
      userLiked: false,
      replies: []
    };

    setComments(prev =>
      prev.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, replies: [...comment.replies, reply] };
        }
        return comment;
      })
    );

    setReplyContent('');
    setReplyTo(null);
    toast.success('Reply added');
  };

  const handleLikeComment = (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(prev =>
        prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? {
                      ...reply,
                      likes: reply.userLiked ? reply.likes - 1 : reply.likes + 1,
                      userLiked: !reply.userLiked
                    }
                  : reply
              )
            };
          }
          return comment;
        })
      );
    } else {
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                likes: comment.userLiked ? comment.likes - 1 : comment.likes + 1,
                userLiked: !comment.userLiked
              }
            : comment
        )
      );
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false, parentId?: string) => (
    <div key={comment.id} className={`${isReply ? 'ml-12' : ''}`}>
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white flex-shrink-0">
          {comment.authorAvatar}
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[#2C3E50]">{comment.authorName}</span>
              <span className="text-xs text-gray-500">{comment.createdAt}</span>
            </div>
            <p className="text-gray-700 text-sm">{comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <button
              onClick={() => handleLikeComment(comment.id, isReply, parentId)}
              className={`flex items-center gap-1 ${
                comment.userLiked ? 'text-[#C4A672]' : 'text-gray-500 hover:text-[#C4A672]'
              } transition-colors`}
            >
              <ThumbsUp className="w-4 h-4" />
              {comment.likes > 0 && comment.likes}
            </button>
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-gray-500 hover:text-[#C4A672] transition-colors"
              >
                Reply
              </button>
            )}
            {(isAdmin || comment.authorId === userId) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="flex-1"
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="bg-[#C4A672] hover:bg-[#8B7355]"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => renderComment(reply, true, comment.id))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl text-[#2C3E50]">Post & Comments</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Original Post */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                {post.authorAvatar}
              </div>
              <div>
                <div className="text-[#2C3E50]">{post.authorName}</div>
                <div className="text-sm text-gray-500">{post.createdAt}</div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

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

            {/* Reaction Summary */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                👍 {post.reactions.like}
              </span>
              <span className="flex items-center gap-1">
                ❤️ {post.reactions.love}
              </span>
              <span className="flex items-center gap-1">
                💡 {post.reactions.insightful}
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <MessageSquare className="w-4 h-4" />
                {comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)} comments
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-6">
            <h3 className="text-[#2C3E50] text-lg">Comments</h3>
            
            {comments.map(comment => renderComment(comment))}

            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Comment Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white flex-shrink-0">
              CU
            </div>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
