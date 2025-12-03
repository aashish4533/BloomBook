import { useState } from 'react';
import { FileText, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X, Printer, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

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
  fileUrl
}: NotesViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 25);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 25);
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    } else {
      alert('No file URL provided');
    }
  };

  const handlePrint = () => {
    // Printing iframe content is tricky cross-origin, but we can try window.print() or just let user print from PDF viewer
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-50">
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
              PDF Document
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#2A2A2A] border-b border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="text-white hover:bg-gray-700"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm w-16 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="text-white hover:bg-gray-700"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-white hover:bg-gray-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            {downloadable && (
              <Button
                onClick={handleDownload}
                size="sm"
                className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-800 relative">
        {fileUrl ? (
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            No PDF URL provided
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-[#1E1E1E] border-t border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-6">
            <span>Format: PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Document loaded successfully</span>
          </div>
        </div>
      </div>
    </div>
  );
}
