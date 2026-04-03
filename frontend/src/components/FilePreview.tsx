import React, { useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Loader2, FileWarning, ZoomIn, ZoomOut, Maximize, Minimize, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import DOMPurify from 'dompurify';

// Use UNPKG for PDF.js worker
const pdfjsVersion = '3.11.174';

interface FilePreviewProps {
    fileUrl: string;
    fileType?: string;
    isTeaser?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, fileType, isTeaser = true }) => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
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
                <p>{error}</p>
            </div>
        );
    }

    // PDF 
    if (type === 'pdf') {
        return (
            <div className="h-full w-full min-h-[600px] flex flex-col">
                <div className="flex justify-end p-2 bg-gray-100 border-b">
                    <Button
                        variant={isBlurred ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => setIsBlurred(!isBlurred)}
                    >
                        <EyeOff className="w-4 h-4 mr-2" />
                        {isBlurred ? "Unblur" : "Blur Mode"}
                    </Button>
                </div>
                <div className="flex-1 relative border rounded-md overflow-hidden bg-gray-100">
                    <BlurOverlay />
                    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`}>
                        <Viewer
                            fileUrl={fileUrl}
                            plugins={[defaultLayoutPluginInstance]}
                            initialPage={0}
                            renderPage={(props) => {
                                // Teaser Mode: Only render the first page (index 0)
                                if (isTeaser && props.pageIndex > 0) {
                                    return (
                                        <div className="flex items-center justify-center h-full w-full bg-gray-50 border-2 border-dashed border-gray-200 m-4 rounded-lg min-h-[500px]">
                                            <div className="text-center p-6 opacity-50">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <EyeOff className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Page {props.pageIndex + 1} Locked</h3>
                                                <p className="text-gray-500 max-w-sm mx-auto">
                                                    This content is part of the exchange.
                                                    <br />
                                                    Complete the transaction to view the full document.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <>
                                        {props.canvasLayer.children}
                                        {props.textLayer.children}
                                        {props.annotationLayer.children}
                                    </>
                                );
                            }}
                            renderLoader={(percentages: number) => (
                                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                        <span className="text-sm text-gray-500">Loading PDF {Math.round(percentages)}%</span>
                                    </div>
                                </div>
                            )}
                        />
                    </Worker>
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
                        style={{
                            maxWidth: fitToScreen ? '100%' : 'none',
                            maxHeight: fitToScreen ? '100%' : 'none',
                            width: fitToScreen ? 'auto' : `${scale * 100}%`,
                            objectFit: 'contain'
                        }}
                        onError={() => setError("Failed to load image.")}
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
            <p className="text-sm">Please download the file to view it.</p>
        </div>
    );
};
