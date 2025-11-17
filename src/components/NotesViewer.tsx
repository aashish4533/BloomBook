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
}

export function NotesViewer({ 
  title, 
  author = 'BookOra',
  pages = 12, 
  onClose,
  downloadable = true 
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
    alert('Downloading PDF...\n\nIn a production app, this would trigger a PDF download.');
  };

  const handlePrint = () => {
    alert('Opening print dialog...\n\nIn a production app, this would open the browser print dialog.');
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
          {/* Page Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-white hover:bg-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm">
              Page {currentPage} of {pages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(pages, currentPage + 1))}
              disabled={currentPage === pages}
              className="text-white hover:bg-gray-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

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
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
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
      <div className="flex-1 overflow-auto bg-gray-800 p-8">
        <div className="max-w-4xl mx-auto">
          <Card 
            className="bg-white shadow-2xl"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          >
            <div className="p-12">
              {/* PDF Content Placeholder */}
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b pb-6">
                  <h1 className="text-4xl text-[#2C3E50] mb-2">{title}</h1>
                  <p className="text-gray-600">Page {currentPage}</p>
                </div>

                {/* Mock Content */}
                <div className="space-y-4">
                  <h2 className="text-2xl text-[#2C3E50]">Chapter {currentPage}: Introduction</h2>
                  
                  <p className="text-gray-700 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                    exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>

                  <p className="text-gray-700 leading-relaxed">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
                    fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
                    culpa qui officia deserunt mollit anim id est laborum.
                  </p>

                  {/* Code block example */}
                  <div className="bg-gray-100 rounded-lg p-4 my-6">
                    <pre className="text-sm text-gray-800 overflow-x-auto">
{`function example() {
  console.log("Sample code block");
  return true;
}`}
                    </pre>
                  </div>

                  <h3 className="text-xl text-[#2C3E50] mt-6">Key Points</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Important concept number one with detailed explanation</li>
                    <li>Key takeaway from this section</li>
                    <li>Critical information to remember</li>
                    <li>Additional notes and references</li>
                  </ul>

                  <p className="text-gray-700 leading-relaxed mt-6">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque 
                    laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi 
                    architecto beatae vitae dicta sunt explicabo.
                  </p>

                  {/* Image placeholder */}
                  <div className="bg-gray-200 rounded-lg p-8 my-6 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-2" />
                      <p>Figure {currentPage}.1: Diagram or Image</p>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed">
                    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia 
                    consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t pt-6 mt-8 text-center text-sm text-gray-500">
                  <p>{title} - Page {currentPage} of {pages}</p>
                  <p className="mt-1">© 2024 {author}. All rights reserved.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-[#1E1E1E] border-t border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-6">
            <span>Total Pages: {pages}</span>
            <span>File Size: 2.4 MB</span>
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
