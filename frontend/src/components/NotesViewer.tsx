import { useState } from 'react';
import { FileText, Download, X, Printer, Share2, Loader2, FileWarning } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { downloadFile, openFilePreview } from '../utils/fileHandler';
import { toast } from 'sonner';

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

interface NotesViewerProps {
  title: string;
  author?: string;
  pages?: number;
  onClose?: () => void;
  downloadable?: boolean;
  fileUrl?: string;
}

export function NotesViewer({
  title,
  author = 'BookBloom',
  pages = 1,
  onClose,
  downloadable = true,
  fileUrl,
}: NotesViewerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Debug: verify file URL data is arriving
  console.log('NotesViewer — File URL:', fileUrl);

  const previewType = fileUrl ? getPreviewType(fileUrl) : 'unsupported';

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleDownload = async () => {
    if (!fileUrl) {
      toast.error('Download link is missing.');
      return;
    }
    setIsDownloading(true);
    try {
      await downloadFile(fileUrl, `${title || 'document'}.pdf`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Opening file in a new tab instead.');
      window.open(fileUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = () => {
    if (!fileUrl) {
      toast.error('Preview link is missing.');
      return;
    }
    openFilePreview(fileUrl);
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Preview content renderer ──────────────────────────────────────────

  const renderPreview = () => {
    if (!fileUrl) {
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
          <div className="flex items-center justify-center h-full p-4 overflow-auto">
            <img
              src={fileUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                toast.error('Failed to load image');
              }}
            />
          </div>
        );

      // ── PDFs (native browser viewer) ───────────────────────────────
      case 'pdf':
        return (
          <div className="w-full h-full relative">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-[#C4A672]" />
                  <span className="text-sm text-gray-400">Loading PDF…</span>
                </div>
              </div>
            )}
            <iframe
              src={fileUrl}
              className="w-full h-full border-none"
              title="PDF Viewer"
              onLoad={() => setIframeLoading(false)}
            />
          </div>
        );

      // ── Office documents (Google Docs Viewer) ──────────────────────
      case 'office':
        return (
          <div className="w-full h-full relative">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <div className="flex flex-col items-center gap-3 text-white">
                  <Loader2 className="w-10 h-10 animate-spin text-[#C4A672]" />
                  <span className="text-sm text-gray-400">Loading document preview…</span>
                </div>
              </div>
            )}
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              className="w-full h-full border-none"
              title="Document Viewer"
              onLoad={() => setIframeLoading(false)}
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
      <div className="bg-[#1E1E1E] border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8 text-[#C4A672]" />
            <div className="text-white">
              <h2 className="text-xl">{title}</h2>
              <p className="text-sm text-gray-400">by {author}</p>
            </div>
            <Badge variant="outline" className="border-gray-600 text-gray-300">
              {fileUrl ? getFormatLabel(fileUrl) : 'Unknown'}
            </Badge>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#2A2A2A] border-b border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              disabled={!fileUrl}
              className="text-white hover:bg-gray-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              disabled={!fileUrl}
              className="text-white hover:bg-gray-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            {downloadable && (
              <Button
                onClick={handleDownload}
                size="sm"
                disabled={!fileUrl || isDownloading}
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

      {/* Footer */}
      <div className="bg-[#1E1E1E] border-t border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-6">
            <span>Format: {fileUrl ? getFormatLabel(fileUrl) : 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${fileUrl ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{fileUrl ? 'Document loaded successfully' : 'No document URL'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
