/**
 * Downloads a file by fetching it as a blob and triggering a programmatic download.
 * Falls back to opening in a new tab if the fetch fails (e.g. CORS).
 *
 * @param url - The URL of the file to download.
 * @param filename - The desired filename for the downloaded file.
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
    if (!url) {
        console.error('No URL provided for download');
        return;
    }

    try {
        // Fetch the file as a blob to force download even for cross-origin files
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download via fetch failed, falling back to new tab:', error);

        // Fallback: try Cloudinary fl_attachment, then open in new tab
        let fallbackUrl = url;
        if (url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('/fl_attachment/')) {
            fallbackUrl = url.replace('/upload/', '/upload/fl_attachment/');
        }
        window.open(fallbackUrl, '_blank');
    }
};

/**
 * Opens a file in a new secure browser tab for previewing.
 *
 * @param url - The URL of the file to preview.
 */
export const openFilePreview = (url: string): void => {
    if (!url) {
        console.error('No URL provided for preview');
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * True when the URL cannot be loaded by third-party viewers (e.g. Google Docs) or is unsafe to embed
 * in an iframe next to chrome-error navigations (typical on localhost / private IPs with self-signed HTTPS).
 */
export function cannotUseEmbeddedExternalViewer(fileUrl: string): boolean {
    try {
        const u = new URL(fileUrl, typeof window !== 'undefined' ? window.location.href : 'https://localhost');
        const h = u.hostname.toLowerCase();
        if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true;
        if (/^192\.168\.\d+\.\d+$/.test(h)) return true;
        if (/^10\.\d+\.\d+\.\d+$/.test(h)) return true;
        if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return true;
        return false;
    } catch {
        return true;
    }
}
