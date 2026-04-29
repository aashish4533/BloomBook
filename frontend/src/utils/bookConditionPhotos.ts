/** Shared 4-slot book photos for AI condition verification (sell / rent / exchange). */

export type BookPhotoSlotKey = 'front' | 'back' | 'firstPage' | 'lastPage' | 'pageEdges';
export type BookImageSlots = Record<BookPhotoSlotKey, File | null>;

export interface BookConditionVerdict {
  isBook: boolean;
  allSlotsMatch: boolean;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  confidence: number;
  damageFlags: string[];
  reason: string;
  /** True when image 5 shows the closed book’s page block (top/bottom/side edges), not covers or random objects. */
  edgePhotoValid: boolean;
  /** Heuristic risk that the copy is institutional / library property. */
  libraryRisk: 'none' | 'low' | 'medium' | 'high';
  /** Short phrases for what suggested library ownership (stamps, wording, slip pockets, non-ISBN barcodes, etc.). */
  librarySignals: string[];
  /** When true, listing should be held for manual review (high/medium risk or uncertain barcode). */
  needsManualReview: boolean;
}

export const BOOK_PHOTO_SLOT_ORDER: BookPhotoSlotKey[] = [
  'front',
  'back',
  'firstPage',
  'lastPage',
  'pageEdges',
];

export const BOOK_PHOTO_SLOT_LABELS: Record<BookPhotoSlotKey, string> = {
  front: 'Front Cover',
  back: 'Back Cover',
  firstPage: 'First Page',
  lastPage: 'Last Page',
  pageEdges: 'Page edges (closed book)',
};

export const MAX_BOOK_PHOTO_BYTES = 5 * 1024 * 1024;

export function emptyBookImageSlots(): BookImageSlots {
  return { front: null, back: null, firstPage: null, lastPage: null, pageEdges: null };
}

export async function validateBookPhotoFile(file: File, label: string): Promise<string | null> {
  if (!file.type.startsWith('image/')) return `${label}: please upload an image file.`;
  if (file.size > MAX_BOOK_PHOTO_BYTES) return `${label}: image must be under 5 MB.`;
  const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
  if (!dims) return `${label}: could not read image.`;
  if (dims.w < 400 || dims.h < 400) {
    return `${label}: image resolution is too low (need at least 400×400). Retake with better lighting.`;
  }
  return null;
}
