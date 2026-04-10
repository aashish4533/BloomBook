import React, { useState, useEffect } from 'react';
import { Loader2, FileWarning, ZoomIn, ZoomOut, Maximize, Minimize, EyeOff, Download, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';
import { cannotUseEmbeddedExternalViewer, openFilePreview } from '../utils/fileHandler';

interface FilePreviewProps {
    fileUrl: string;
    fileType?: string;
    /** When true, image previews use “teaser” tooling; PDFs always show the full file in the browser viewer. */
    isTeaser?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileType, isTeaser = false }) => {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [fitToScreen, setFitToScreen] = useState(true);

    // Blur state for "Exchange" logic
    const [isBlurred, setIsBlurred] = useState(false); // Default to false for now, can be toggled via prop if needed later

    const getFileType = (url: string) => {
        if (fileType) return fileType.toLowerCase();
        const cleanUrl = url.split('?')[0];
        const extension = cleanUrl.split('.').pop()?.trim().toLowerCase();

        if (extension === 'pdf') return 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
        if (['doc', 'docx'].includes(extension || '')) return 'docx';
        if (['xls', 'xlsx', 'csv'].includes(extension || '')) return 'xlsx';
        return 'unknown';
    };

    const type = getFileType(fileUrl);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            setError(null);
            try {
                if (type === 'docx') {
                    const response = await fetch(fileUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setContent(result.value);
                } else if (type === 'xlsx') {
                    const response = await fetch(fileUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const html = XLSX.utils.sheet_to_html(sheet);
                    setContent(html);
                }
            } catch (err: any) {
                console.error("Preview error:", err);
                setError("Failed to load document preview. Please download the file to view it.");
            } finally {
                setLoading(false);
            }
        };

        if (['docx', 'xlsx'].includes(type) && !content) {
            fetchContent();
        } else {
            setLoading(false);
        }
    }, [fileUrl, type]);

    const handleZoomIn = () => {
        setFitToScreen(false);
        setScale(prev => Math.min(prev + 0.1, 3));
    };

    const handleZoomOut = () => {
        setFitToScreen(false);
        setScale(prev => Math.max(prev - 0.1, 0.5));
    };

    const toggleFit = () => {
        setFitToScreen(!fitToScreen);
        setScale(1);
    };

    const CustomToolbar = () => (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md border text-gray-700 mb-2">
            <div className="flex items-center gap-2">
                <Button
                    variant={isBlurred ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setIsBlurred(!isBlurred)}
                    title="Toggle Blur (Demo)"
                >
                    <EyeOff className="w-4 h-4 mr-2" />
                    {isBlurred ? "Unblur" : "Blur Preview"}
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium mr-2">Zoom: {Math.round(fitToScreen ? 100 : scale * 100)}%</span>
                <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-gray-300 mx-2" />
                <Button
                    variant={fitToScreen ? "secondary" : "ghost"}
                    size="sm"
                    onClick={toggleFit}
                    title={fitToScreen ? "Show Original Size" : "Fit to Screen"}
                >
                    {fitToScreen ? <Minimize className="w-4 h-4 mr-2" /> : <Maximize className="w-4 h-4 mr-2" />}
                    {fitToScreen ? 'Fit to Screen' : 'Original Size'}
                </Button>
            </div>
        </div>
    );

    const BlurOverlay = () => (
        isBlurred ? (
            <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/30 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm mx-4">
                    <EyeOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Preview Restricted</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        This document is part of a premium exchange. Complete the exchange to view the full content.
                    </p>
                    <Button onClick={() => setIsBlurred(false)} variant="outline">
                        Unlock Preview (Demo)
                    </Button>
                </div>
            </div>
        ) : null
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-gray-500">Loading preview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-md text-gray-500 p-8 text-center">
                <FileWarning className="w-12 h-12 mb-4 text-red-400" />
                <p className="mb-4">{error}</p>
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#C4A672] hover:bg-[#8B7355] text-white rounded-md transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Download File
                </a>
            </div>
        );
    }

    // PDF — use the browser’s built-in viewer (iframe). pdf.js often fails on Firebase Storage URLs (CORS),
    // while direct embed works the same way as opening the file in a new tab.
    if (type === 'pdf') {
        if (cannotUseEmbeddedExternalViewer(fileUrl)) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-md text-gray-600 p-8 text-center gap-4">
                    <FileWarning className="w-12 h-12 text-amber-500" />
                    <p className="text-sm max-w-md">
                        PDF iframe preview is skipped for localhost/private URLs to avoid browser errors (e.g. loading https://localhost from a chrome-error frame). Open the file in a new tab.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => openFilePreview(fileUrl)} className="border-[#C4A672] text-[#C4A672]">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Open in new tab
                    </Button>
                </div>
            );
        }
        const baseUrl = fileUrl.split('#')[0];
        const pdfSrc = `${baseUrl}#toolbar=1`;
        return (
            <div className="h-full w-full min-h-[600px] flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-2 p-2 bg-gray-100 border-b flex-shrink-0">
                    <span className="text-xs text-gray-600">Scroll to browse all pages (browser PDF viewer)</span>
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#C4A672] hover:underline shrink-0"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Open in new tab
                    </a>
                </div>
                <div className="flex-1 relative border rounded-md overflow-hidden bg-gray-100 min-h-0">
                    <iframe
                        src={pdfSrc}
                        className="absolute inset-0 w-full h-full border-none"
                        title="PDF preview"
                    />
                </div>
                <div className="flex justify-center py-2 border-t bg-gray-50 flex-shrink-0">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </a>
                </div>
            </div>
        );
    }

    // IMAGE
    if (type === 'image') {
        return (
            <div className="h-full flex flex-col min-h-[600px]">
                <CustomToolbar />
                <div className="flex-1 relative overflow-auto bg-black/5 rounded-md p-4 flex items-start justify-center">
                    <BlurOverlay />
                    <img
                        src={fileUrl}
                        alt="Preview"
                        className="transition-all duration-200"
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        style={{
                            maxWidth: fitToScreen ? '100%' : 'none',
                            maxHeight: fitToScreen ? '100%' : 'none',
                            width: fitToScreen ? 'auto' : `${scale * 100}%`,
                            objectFit: 'contain'
                        }}
                        onError={() => setError("Failed to load image. The file may be restricted or unavailable.")}
                    />
                </div>
            </div>
        );
    }

    // DOCX / XLSX
    if (type === 'docx' || type === 'xlsx') {
        return (
            <div className="h-full flex flex-col min-h-[600px]">
                <CustomToolbar />
                <div className="flex-1 relative overflow-auto bg-white p-4 border rounded-md shadow-sm">
                    <BlurOverlay />
                    <div
                        className={`prose max-w-none transition-all duration-200 ${type === 'xlsx' ? 'table-auto' : ''}`}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                        style={{
                            zoom: fitToScreen ? '1' : scale,
                            // Basic styling for the raw HTML table
                            fontSize: '14px',
                        }}
                    />
                    {type === 'xlsx' && (
                        <style>{`
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f9f9f9; font-weight: bold; }
                            tr:nth-child(even) { background-color: #f9f9f9; }
                        `}</style>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-md text-gray-500 p-8 text-center">
            <FileWarning className="w-12 h-12 mb-4" />
            <p className="mb-2 text-lg font-medium">Preview not supported for this file type.</p>
            <p className="text-sm mb-4">Please download the file to view it.</p>
            <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#C4A672] hover:bg-[#8B7355] text-white rounded-md transition-colors"
            >
                <Download className="w-4 h-4" />
                Download File
            </a>
        </div>
    );
};
