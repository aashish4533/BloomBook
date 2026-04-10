import { useState, useEffect } from 'react';
import { FileText, Download, X, Printer, Share2, Loader2, FileWarning, MessageSquare, Send, Star, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ScrollArea } from './ui/scroll-area';
import { downloadFile, openFilePreview, cannotUseEmbeddedExternalViewer } from '../utils/fileHandler';
import { toast } from 'sonner';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PreviewType = 'image' | 'pdf' | 'office' | 'unsupported';

/** Extracts the lowercase file extension from a URL (strips query strings). */
function getExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    return ext;
  } catch {
    return '';
  }
}

/** Determines how a file should be previewed based on its URL extension. */
function getPreviewType(url: string): PreviewType {
  const ext = getExtension(url);

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const pdfExts = ['pdf'];
  const officeExts = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'csv', 'txt'];

  if (imageExts.includes(ext)) return 'image';
  if (pdfExts.includes(ext)) return 'pdf';
  if (officeExts.includes(ext)) return 'office';

  // Cloudinary URLs often don't end with an extension — check for hints
  if (url.includes('/image/upload/')) return 'image';

  // Default: try Google Docs viewer (works for many formats) if we have a URL
  return 'office';
}

/** Returns a human-readable label for the file format. */
function getFormatLabel(url: string): string {
  const ext = getExtension(url);
  if (ext) return ext.toUpperCase();
  return 'Document';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userImage?: string;
  rating: number;
  createdAt: Timestamp;
}

interface NotesViewerProps {
  title: string;
  author?: string;
  id: string; // Document ID for comments
  pages?: number;
  onClose?: () => void;
  downloadable?: boolean;
  url?: string; // Renamed from fileUrl
}

export function NotesViewer({
  title,
  author = 'BookBloom',
  id,
  pages = 1,
  onClose,
  downloadable = true,
  url,
}: NotesViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  // Comments State
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load Comments
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'notes', id, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      setComments(loadedComments);
    });
    return () => unsubscribe();
  }, [id]);

  const previewType = url ? getPreviewType(url) : 'unsupported';

  // Fallback timer for iframe loading
  useEffect(() => {
    if (iframeLoading && previewType === 'office') {
      const timer = setTimeout(() => {
        // We don't necessarily set loading to false, just let the user see the fallback
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [iframeLoading, previewType]);

  // Debug: verify file URL data is arriving


  // ── Handlers ──────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!url) {
      toast.error('Download link is missing.');
      return;
    }
    setIsDownloading(true);
    try {
      await downloadFile(url, `${title || 'document'}.${getExtension(url) || 'pdf'}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Opening file in a new tab instead.');
      window.open(url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    if (!url) {
      toast.error('Preview link is missing.');
      return;
    }
    openFilePreview(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmitComment = async () => {
    if (!auth.currentUser) {
      toast.error('You must be logged in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await addDoc(collection(db, 'notes', id, 'comments'), {
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userImage: auth.currentUser.photoURL,
        rating: rating,
        createdAt: serverTimestamp()
      });
      setNewComment('');
      setRating(0);
      toast.success('Review posted!');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post review');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ── Preview content renderer ──────────────────────────────────────────

  const renderPreview = () => {
    if (!url) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white gap-4">
          <FileWarning className="w-16 h-16 text-gray-500" />
          <p className="text-lg">No file URL provided</p>
        </div>
      );
    }

    switch (previewType) {
      // ── Images ─────────────────────────────────────────────────────
      case 'image':
        return (
          <div className="flex items-center justify-center h-[80vh] p-4 overflow-auto">
            <img
              src={url}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                toast.error('Failed to load image');
              }}
            />
          </div>
        );

      // ── PDFs (native browser viewer) ───────────────────────────────
      case 'pdf':
        if (cannotUseEmbeddedExternalViewer(url)) {
          return (
            <div className="w-full h-[80vh] flex flex-col items-center justify-center bg-gray-900 text-white px-6 text-center gap-4">
              <FileWarning className="w-16 h-16 text-[#C4A672]" />
              <p className="text-lg font-medium">PDF preview in this window isn&apos;t available</p>
              <p className="text-sm text-gray-400 max-w-md">
                Files on localhost or private IPs can break the embedded viewer and trigger browser security errors.
                Open the PDF in a new tab instead.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button type="button" variant="outline" onClick={handlePreview} className="border-[#C4A672] text-[#C4A672]">
                  Open in new tab
                </Button>
                {downloadable && (
                  <Button type="button" onClick={handleDownload} disabled={isDownloading} className="bg-[#C4A672] text-white">
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Downloading…' : 'Download'}
                  </Button>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-[80vh] relative">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-[#C4A672]" />
                  <span className="text-sm text-gray-400">Loading PDF…</span>
                </div>
              </div>
            )}
            <iframe
              src={`${url}#toolbar=0`}
              className="w-full h-full min-h-[600px] border-none"
              title="PDF Viewer"
              onLoad={() => setIframeLoading(false)}
            />
          </div>
        );

      // ── Office documents (Google Docs Viewer) ──────────────────────
      case 'office':
        if (cannotUseEmbeddedExternalViewer(url)) {
          return (
            <div className="w-full h-[80vh] flex flex-col items-center justify-center bg-gray-900 text-white px-6 text-center gap-4">
              <FileWarning className="w-16 h-16 text-[#C4A672]" />
              <p className="text-lg font-medium">Inline preview isn&apos;t available for this address</p>
              <p className="text-sm text-gray-400 max-w-md">
                Google Docs Viewer cannot fetch localhost or private-network URLs. Opening in a new tab avoids the
                broken iframe (chrome-error) that can cause &quot;Unsafe attempt to load localhost&quot; messages.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button type="button" variant="outline" onClick={handlePreview} className="border-[#C4A672] text-[#C4A672]">
                  Open in new tab
                </Button>
                {downloadable && (
                  <Button type="button" onClick={handleDownload} disabled={isDownloading} className="bg-[#C4A672] text-white">
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Downloading…' : 'Download'}
                  </Button>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="w-full h-[80vh] relative group">
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 z-10 transition-opacity duration-300">
                <div className="flex flex-col items-center gap-4 text-white max-w-sm text-center px-6">
                  <Loader2 className="w-10 h-10 animate-spin text-[#C4A672]" />
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-300">Synchronizing with Bloom Preview Orbits...</span>
                    <p className="text-xs text-gray-500">If the preview fails to materialize, use the stabilization bridge below.</p>
                  </div>
                  
                  {/* Immediate Fallback Action */}
                  <div className="mt-4 flex flex-col gap-2 w-full">
                    <Button 
                      variant="outline" 
                      onClick={handlePreview}
                      className="border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672]/10"
                    >
                      View in New Tab
                    </Button>
                    <Button 
                      onClick={handleDownload}
                      className="bg-[#C4A672] text-white hover:bg-[#8B7355]"
                    >
                      Download Material
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
              className="w-full h-full min-h-[600px] border-none"
              title="Document Viewer"
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeLoading(false);
                toast.error("Preview stabilization failed.");
              }}
            />
          </div>
        );

      // ── Unsupported ────────────────────────────────────────────────
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white gap-6">
            <FileWarning className="w-20 h-20 text-gray-500" />
            <div className="text-center">
              <p className="text-xl mb-2">Preview not supported for this file type</p>
              <p className="text-sm text-gray-400">Download the file to view it on your device</p>
            </div>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8 py-3 text-base"
            >
              <Download className="w-5 h-5 mr-2" />
              {isDownloading ? 'Downloading…' : 'Download to View'}
            </Button>
          </div>
        );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-[100]">
      {/* Header */}
      <div className="bg-[#1E1E1E] border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-[#C4A672]" />
            <div className="text-white">
              <h2 className="text-xl">{title}</h2>
              <p className="text-sm text-gray-400">by {author}</p>
            </div>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {url ? getFormatLabel(url) : 'Unknown'}
            </Badge>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col grow">
          {/* Toolbar */}
          <div className="bg-[#2A2A2A] border-b border-gray-700 px-6 py-3 flex-shrink-0">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <Button
                  variant={showComments ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className={`text-white hover:bg-gray-700 ${showComments ? 'bg-gray-700' : ''}`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showComments ? 'Hide Reviews' : 'Show Reviews'}
                </Button>
                <div className="w-px h-6 bg-gray-600 mx-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrint}
                  disabled={!url}
                  className="text-white hover:bg-gray-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePreview}
                  disabled={!url}
                  className="text-white hover:bg-gray-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
                {downloadable && (
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    disabled={!url || isDownloading}
                    className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? 'Downloading…' : 'Download'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Document Viewer */}
          <div className="flex-1 overflow-hidden bg-gray-800 relative">
            {renderPreview()}
          </div>
        </div>

        {/* Comments Sidebar */}
        {showComments && (
          <div className="w-80 sm:w-96 bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Reviews & Discussion
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowComments(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {comments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No reviews yet.</p>
                  <p className="text-sm">Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.userImage} />
                            <AvatarFallback><User className="w-3 h-3" /></AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-gray-900">{comment.userName}</span>
                        </div>
                        {comment.rating > 0 && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs ml-1 font-medium">{comment.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                      <span className="text-xs text-gray-400">
                        {comment.createdAt?.toDate().toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-gray-100 space-y-3 bg-white">
              <div className="flex items-center gap-1 justify-center pb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a review..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <Button
                  size="icon"
                  onClick={handleSubmitComment}
                  disabled={submittingComment || !newComment.trim()}
                  className="bg-[#C4A672] hover:bg-[#8B7355]"
                >
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {!showComments && (
        <div className="bg-[#1E1E1E] border-t border-gray-700 px-6 py-3 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-6">
              <span>Format: {url ? getFormatLabel(url) : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${url ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{url ? 'Document loaded successfully' : 'No document URL'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
