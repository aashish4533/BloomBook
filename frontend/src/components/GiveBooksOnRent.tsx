import { useState } from 'react';
import { ArrowLeft, BookOpen, DollarSign, MapPin, Camera, Check, Plus, Search, X, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { db, auth, storage, functions } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { BarcodeScanner } from './BarcodeScanner';
import { lookupBookMetadataByIsbn, normalizeIsbnInput } from '../utils/isbnBookLookup';
import {
  BOOK_PHOTO_SLOT_LABELS,
  BOOK_PHOTO_SLOT_ORDER,
  emptyBookImageSlots,
  type BookConditionVerdict,
  type BookImageSlots,
  type BookPhotoSlotKey,
} from '../utils/bookConditionPhotos';

interface GiveBooksOnRentProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'details' | 'pricing' | 'location' | 'review' | 'success';

interface BookData {
  title: string;
  author: string;
  isbn: string;
  condition: string;
  description: string;
  rentalPeriod: string;
  pricePerWeek: string;
  securityDeposit: string;
  originalPrice: string;
  imageSlots: BookImageSlots;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CONDITION_TO_VALUE: Record<BookConditionVerdict['condition'], string> = {
  'New': 'new',
  'Like New': 'new',
  'Good': 'good',
  'Fair': 'fair',
  'Poor': 'fair',
};

function bookDetailsRentError(book: BookData): string | null {
  if (!book.title.trim() || !book.author.trim() || !book.condition) {
    return 'Each book needs title, author, and condition.';
  }
  for (const slot of BOOK_PHOTO_SLOT_ORDER) {
    if (!book.imageSlots[slot]) {
      return `Upload all 5 photos (including page edges of the closed book) for "${book.title || 'this book'}".`;
    }
  }
  return null;
}

async function validateImageFile(file: File, label: string): Promise<string | null> {
  if (!file.type.startsWith('image/')) return `${label}: please upload an image file.`;
  if (file.size > MAX_IMAGE_BYTES) return `${label}: image must be under 5 MB.`;
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

interface ImageSlotInputProps {
  slot: BookPhotoSlotKey;
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
}

function ImageSlotInput({ slot, label, file, onPick }: ImageSlotInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting same file
    if (!picked) return;
    setValidating(true);
    const err = await validateImageFile(picked, label);
    setValidating(false);
    if (err) {
      toast.error(err);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(picked);
    setPreviewUrl(url);
    onPick(picked);
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onPick(null);
  };

  return (
    <label
      className={`relative block rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
        file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
        aria-label={`Upload ${label}`}
      />
      <div className="aspect-[4/3] w-full flex items-center justify-center p-2">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="text-center px-2">
            <Camera className="w-6 h-6 mx-auto text-gray-400 mb-1" />
            <p className="text-xs font-medium text-gray-700">{label}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {slot === 'firstPage' || slot === 'lastPage'
                ? 'Inside page'
                : slot === 'pageEdges'
                  ? 'Closed book — paper edges'
                  : 'Cover photo'}
            </p>
          </div>
        )}
      </div>
      <div className="absolute top-1 left-1 bg-white/90 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
        {label}
      </div>
      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleClear();
          }}
          title="Remove photo"
          className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-gray-600 hover:text-red-500 hover:bg-white shadow-sm"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {validating && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="text-xs bg-white px-2 py-1 rounded shadow">Checking…</div>
        </div>
      )}
    </label>
  );
}

export function GiveBooksOnRent({ onClose, onSuccess }: GiveBooksOnRentProps) {
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [addedBooks, setAddedBooks] = useState<BookData[]>([]);

  // Current book form data
  const [formData, setFormData] = useState<BookData>({
    title: '',
    author: '',
    isbn: '',
    condition: '',
    description: '',
    rentalPeriod: '',
    pricePerWeek: '',
    securityDeposit: '',
    originalPrice: '',
    imageSlots: emptyBookImageSlots(),
  });

  // Common location data (applies to all books)
  const [locationData, setLocationData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });

  const handleNext = () => {
    if (currentStep === 'details') {
      const err = bookDetailsRentError(formData);
      if (err) {
        toast.error(err);
        return;
      }
    }

    if (currentStep === 'pricing') {
      // Validate Pricing
      const original = parseFloat(formData.originalPrice);
      const rent = parseFloat(formData.pricePerWeek);

      if (!original || !rent) {
        toast.error('Please enter valid prices');
        return;
      }

      const minPrice = original * 0.01;
      const maxPrice = original * 0.03;

      if (rent <= minPrice || rent >= maxPrice) {
        toast.error(`Rent price must be between Rs. ${minPrice.toFixed(0)} (1%) and Rs. ${maxPrice.toFixed(0)} (3%) of Original Price`);
        return;
      }
    }

    const steps: Step[] = ['details', 'pricing', 'location', 'review', 'success'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['details', 'pricing', 'location', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    } else {
      onClose();
    }
  };

  const handleAddAnother = () => {
    if (addedBooks.length + 1 >= 4) {
      toast.error('Maximum 4 books allowed');
      return;
    }
    const err = bookDetailsRentError(formData);
    if (err) {
      toast.error(err);
      return;
    }
    setAddedBooks([...addedBooks, formData]);
    // Reset form for next book
    setFormData({
      title: '',
      author: '',
      isbn: '',
      condition: '',
      description: '',
      rentalPeriod: '',
      pricePerWeek: '',
      securityDeposit: '',
      originalPrice: '',
      imageSlots: emptyBookImageSlots(),
    });
    setCurrentStep('details');
    toast.success('Book added! Enter details for the next book.');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isbnLookupBusy, setIsbnLookupBusy] = useState(false);
  const [isbnError, setIsbnError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please login to submit listing');
      return;
    }

    setIsSubmitting(true);

    try {
      const allBooks = [...addedBooks, formData];
      for (const book of allBooks) {
        const err = bookDetailsRentError(book);
        if (err) {
          toast.error(err);
          return;
        }
      }

      const verifyCall = httpsCallable<
        { images: Record<BookPhotoSlotKey, string> },
        BookConditionVerdict
      >(functions, 'verifyBookCondition', { timeout: 90000 });

      // Process each book
      for (let bIdx = 0; bIdx < allBooks.length; bIdx++) {
        const book = allBooks[bIdx];

        // Upload the 4 slot images to Firebase Storage
        const slotUrls: Record<BookPhotoSlotKey, string> = {
          front: '',
          back: '',
          firstPage: '',
          lastPage: '',
          pageEdges: '',
        };
        const draftId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        for (const slot of BOOK_PHOTO_SLOT_ORDER) {
          const file = book.imageSlots[slot];
          if (!file) {
            toast.error(`Missing ${BOOK_PHOTO_SLOT_LABELS[slot]} photo for "${book.title}".`);
            return;
          }
          try {
            const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
            const fileName = `${draftId}_${slot}.${ext || 'jpg'}`;
            const storageRef = ref(storage, `book_images/${user.uid}/${fileName}`);
            await uploadBytes(storageRef, file);
            slotUrls[slot] = await getDownloadURL(storageRef);
          } catch (err) {
            console.error('[Storage] Upload failed:', err);
            toast.error(`Failed to upload ${BOOK_PHOTO_SLOT_LABELS[slot]} for "${book.title}".`);
            return;
          }
        }

        // Ask the server to verify the images and grade condition
        let verdict: BookConditionVerdict | null = null;
        const verifyToast = toast.loading(
          allBooks.length > 1
            ? `Verifying book ${bIdx + 1} of ${allBooks.length}: "${book.title}"…`
            : `Verifying "${book.title}"…`
        );
        try {
          const res = await verifyCall({ images: slotUrls });
          verdict = res.data;
          toast.dismiss(verifyToast);
        } catch (err: unknown) {
          toast.dismiss(verifyToast);
          const code = String((err as { code?: string })?.code ?? '');
          if (code.includes('unauthenticated')) {
            toast.error('Please sign in again to verify book condition.');
            return;
          }
          console.warn('[verifyBookCondition] failed, proceeding as pending:', err);
          toast.warning(
            `Condition check is unavailable for "${book.title}". Saved as pending admin review.`
          );
        }

        if (verdict && (!verdict.isBook || !verdict.allSlotsMatch)) {
          toast.error(
            verdict.isBook
              ? `Photos for "${book.title}" do not match the required slots (including page edges). ${verdict.reason || ''}`.trim()
              : `The uploaded photos for "${book.title}" do not look like a book. ${verdict.reason || ''}`.trim()
          );
          return;
        }

        if (verdict && verdict.edgePhotoValid === false) {
          toast.error(
            `Page-edges photo for "${book.title}" must show the closed book’s paper block. ${verdict.reason || ''}`.trim()
          );
          return;
        }

        const sellerCondition = book.condition;
        const aiCondition = verdict ? CONDITION_TO_VALUE[verdict.condition] : '';
        const conditionMismatch = Boolean(verdict && aiCondition && aiCondition !== sellerCondition);
        const lowConfidence = Boolean(verdict && verdict.confidence < 0.6);
        const libraryReview = Boolean(
          verdict &&
            (verdict.needsManualReview ||
              verdict.libraryRisk === 'medium' ||
              verdict.libraryRisk === 'high')
        );
        const needsReview = !verdict || lowConfidence || conditionMismatch || libraryReview;

        const listingData = {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          condition: book.condition,
          description: book.description,
          rentalPeriod: book.rentalPeriod,
          price: Number(book.pricePerWeek),
          pricePerWeek: Number(book.pricePerWeek),
          securityDeposit: Number(book.securityDeposit),
          originalPrice: Number(book.originalPrice),
          images: BOOK_PHOTO_SLOT_ORDER.map((s) => slotUrls[s]),
          imageSlots: slotUrls,
          conditionVerified: Boolean(verdict && !needsReview),
          conditionAI: verdict?.condition ?? null,
          conditionConfidence: verdict?.confidence ?? null,
          damageFlags: verdict?.damageFlags ?? [],
          conditionReason: verdict?.reason ?? null,
          conditionMismatch,
          edgePhotoValid: verdict?.edgePhotoValid ?? null,
          libraryRisk: verdict?.libraryRisk ?? null,
          librarySignals: verdict?.librarySignals ?? [],
          libraryReviewFlag: libraryReview,
          aiVerdictAt: serverTimestamp(),
          location: {
            address: locationData.address,
            city: locationData.city,
            state: locationData.state,
            zipCode: locationData.pincode,
          },
          contactPhone: locationData.phone,
          userId: user.uid,
          seller: {
            name: user.displayName || 'Anonymous',
            rating: 0,
            totalSales: 0,
            avatar: user.photoURL || '',
          },
          type: 'rent',
          availableFor: ['rent'],
          status: needsReview ? 'pending' : 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'books'), listingData);

        if (verdict) {
          if (needsReview) {
            toast.warning(
              `"${book.title}" listed (pending review). AI graded: ${verdict.condition} (${Math.round(verdict.confidence * 100)}% confident).`
            );
          } else {
            toast.success(
              `"${book.title}" verified. AI graded: ${verdict.condition} (${Math.round(verdict.confidence * 100)}% confident).`
            );
          }
        }
      }

      toast.success('Books listed for rent successfully!');
      setCurrentStep('success');

      // Auto redirect after 4 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onClose();
      }, 4000);

    } catch (err: any) {
      console.error('Failed to submit listing:', err);
      toast.error(`Failed to create listing: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof BookData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleIsbnAutofill = async (isbnOverride?: string) => {
    const raw = (isbnOverride ?? formData.isbn).trim();
    setIsbnLookupBusy(true);
    setIsbnError('');
    try {
      const result = await lookupBookMetadataByIsbn(raw);
      if (!result.ok) {
        setIsbnError(result.error);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        isbn: result.displayIsbn,
        title: result.title,
        author: result.author,
        ...(result.description ? { description: result.description } : {}),
      }));
      toast.success('Book details filled from ISBN');
    } finally {
      setIsbnLookupBusy(false);
    }
  };

  const handleScanComplete = (rawIsbn: string) => {
    const clean = normalizeIsbnInput(rawIsbn);
    setShowScanner(false);
    setFormData((prev) => ({ ...prev, isbn: clean }));
    void handleIsbnAutofill(clean);
  };

  const updateLocationData = (field: string, value: string) => {
    setLocationData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    const toastId = toast.loading('Fetching precise location…');

    const getPosition = (highAccuracy: boolean) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 28000 : 12000,
          maximumAge: 0,
        });
      });

    const fillFromNominatim = (data: { address?: Record<string, string>; display_name?: string }) => {
      const a = data.address;
      const displayParts = data.display_name
        ? data.display_name.split(',').map((p: string) => p.trim()).filter(Boolean)
        : [];

      if (!a) {
        if (displayParts.length) {
          updateLocationData('address', displayParts.slice(0, 2).join(', '));
          updateLocationData('city', displayParts[Math.min(2, displayParts.length - 1)] || '');
          updateLocationData('state', displayParts.length > 2 ? displayParts[displayParts.length - 2] : '');
          updateLocationData('pincode', '');
          return true;
        }
        return false;
      }

      const road = a.road || a.pedestrian || a.footway || a.residential || a.path || '';
      const house = a.house_number || '';
      const line1 = [house, road].filter(Boolean).join(' ').trim();
      const suburb = a.suburb || a.neighbourhood || a.quarter || a.hamlet || '';
      const addressLine = [line1, suburb].filter(Boolean).join(', ');
      const city =
        a.city ||
        a.town ||
        a.village ||
        a.municipality ||
        a.city_district ||
        a.county ||
        '';
      const state = a.state || a.region || '';
      const pincode = a.postcode || '';

      const address =
        addressLine ||
        (displayParts.length ? displayParts.slice(0, 2).join(', ') : '') ||
        suburb ||
        city;

      if (!address && !city) return false;

      updateLocationData('address', address);
      updateLocationData('city', city);
      updateLocationData('state', state);
      updateLocationData('pincode', pincode);
      return true;
    };

    void (async () => {
      try {
        let pos: GeolocationPosition;
        try {
          pos = await getPosition(true);
        } catch (err: unknown) {
          if (err instanceof GeolocationPositionError && err.code === GeolocationPositionError.TIMEOUT) {
            toast.loading('GPS timed out — using network location…', { id: toastId });
            pos = await getPosition(false);
          } else {
            throw err;
          }
        }

        const { latitude, longitude, accuracy } = pos.coords;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': typeof navigator !== 'undefined' ? navigator.language : 'en',
            },
          }
        );
        if (!res.ok) throw new Error('Address lookup failed');
        const data = await res.json();
        if (data.error) throw new Error(typeof data.error === 'string' ? data.error : 'Address lookup failed');

        if (!fillFromNominatim(data)) {
          toast.error('Could not parse address for this location', { id: toastId });
          return;
        }

        const acc = accuracy != null && !Number.isNaN(accuracy);
        toast.success(
          acc && accuracy <= 50 ? 'Location updated (high accuracy)' : 'Location updated',
          { id: toastId }
        );
      } catch (e: unknown) {
        const msg =
          e instanceof GeolocationPositionError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Failed to fetch location';
        toast.error(msg, { id: toastId });
      }
    })();
  };

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeInUp">
        <Card className="bg-white rounded-xl shadow-hover max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl mb-3 text-gray-900">Listings Created!</h2>
          <p className="text-gray-600 mb-4">
            Your books are now available for rent. Redirecting...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleBack} className="hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl text-gray-900">Give Books on Rent</h1>
            <p className="text-sm text-gray-600">
              {addedBooks.length > 0 ? `Book ${addedBooks.length + 1} of 4` : 'Earn money by renting out your books'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Details', 'Pricing', 'Location', 'Review'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-smooth ${['details', 'pricing', 'location', 'review'].indexOf(currentStep) >= index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {index + 1}
                </div>
                {index < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-smooth ${['details', 'pricing', 'location', 'review'].indexOf(currentStep) > index
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 'details' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Book Details {addedBooks.length > 0 && `(${addedBooks.length + 1}/4)`}
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter book title"
                  className="mt-1 focus-glow"
                />
              </div>
              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => updateFormData('author', e.target.value)}
                  placeholder="Enter author name"
                  className="mt-1 focus-glow"
                />
              </div>
              <div>
                <Label htmlFor="isbn">ISBN (Optional)</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <div className="flex-1 min-w-[12rem]">
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => {
                        updateFormData('isbn', e.target.value);
                        setIsbnError('');
                      }}
                      placeholder="978… or ISBN-10"
                      className={`focus-glow ${isbnError ? 'border-red-500' : ''}`}
                    />
                    {isbnError && (
                      <p className="text-sm text-red-500 mt-1">{isbnError}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:bg-gray-50 shrink-0"
                    title="Scan barcode"
                    onClick={() => setShowScanner(true)}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={isbnLookupBusy}
                    onClick={() => void handleIsbnAutofill()}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {isbnLookupBusy ? 'Looking up…' : 'Auto-fill'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ISBN-10 or ISBN-13. Auto-fill tries Open Library first, then Google Books.
                </p>
              </div>
              <div>
                <Label htmlFor="condition">Book Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: string) => updateFormData('condition', value)}
                >
                  <SelectTrigger className="mt-1 focus-glow">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Like New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  Our AI will cross-check this with the photos you upload below.
                </p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Add any additional details about the book..."
                  rows={3}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Book Images *</Label>
                  <span className="text-xs font-medium text-gray-500">
                    {BOOK_PHOTO_SLOT_ORDER.filter((s) => formData.imageSlots[s]).length}/5 uploaded
                  </span>
                </div>
                <div className="mb-3 p-3 rounded-lg border border-blue-200 bg-blue-50 flex gap-3 items-start">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 flex items-center gap-1">
                      AI Condition Verification
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    </p>
                    <p className="text-blue-800 mt-0.5">
                      Upload five photos — covers, first/last inside pages, and{' '}
                      <span className="font-medium">page edges</span> (closed book from top or bottom). AI checks condition
                      and flags likely library markings for admin review when needed.
                    </p>
                    <p className="text-[11px] text-blue-700/80 mt-1">
                      Min 400×400 per photo · under 5 MB each · good lighting helps accuracy.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {BOOK_PHOTO_SLOT_ORDER.map((slot) => (
                    <ImageSlotInput
                      key={slot}
                      slot={slot}
                      label={BOOK_PHOTO_SLOT_LABELS[slot]}
                      file={formData.imageSlots[slot]}
                      onPick={(file) => {
                        setFormData((prev) => ({
                          ...prev,
                          imageSlots: { ...prev.imageSlots, [slot]: file },
                        }));
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'pricing' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              Rental Pricing
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period">Maximum Rental Period</Label>
                <Select
                  value={formData.rentalPeriod}
                  onValueChange={(value: string) => updateFormData('rentalPeriod', value)}
                >
                  <SelectTrigger className="mt-1 focus-glow">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="2weeks">2 Weeks</SelectItem>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="2months">2 Months</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="originalPrice">Original Price (PKR) *</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => updateFormData('originalPrice', e.target.value)}
                    placeholder="e.g., 2000"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerWeek">Price Per Week (PKR) *</Label>
                  <Input
                    id="pricePerWeek"
                    type="number"
                    value={formData.pricePerWeek}
                    onChange={(e) => updateFormData('pricePerWeek', e.target.value)}
                    placeholder="e.g., 50"
                    className="mt-1 focus-glow"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Rent must be between 1% and 3% of Original Price.
              </p>
              <div>
                <Label htmlFor="deposit">Security Deposit (PKR) *</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => updateFormData('securityDeposit', e.target.value)}
                  placeholder="e.g., 1500"
                  className="mt-1 focus-glow"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Refundable deposit to protect against damage
                </p>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'location' && (
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Pickup Location
              </h2>
              <Button variant="outline" size="sm" onClick={handleUseCurrentLocation} type="button">
                <MapPin className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={locationData.address}
                  onChange={(e) => updateLocationData('address', e.target.value)}
                  placeholder="Street address"
                  className="mt-1 focus-glow"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={locationData.city}
                    onChange={(e) => updateLocationData('city', e.target.value)}
                    placeholder="City"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={locationData.state}
                    onChange={(e) => updateLocationData('state', e.target.value)}
                    placeholder="State"
                    className="mt-1 focus-glow"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    value={locationData.pincode}
                    onChange={(e) => updateLocationData('pincode', e.target.value)}
                    placeholder="PIN Code"
                    className="mt-1 focus-glow"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={locationData.phone}
                    onChange={(e) => updateLocationData('phone', e.target.value)}
                    placeholder="Contact number"
                    className="mt-1 focus-glow"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {currentStep === 'review' && (
          <Card className="p-6 shadow-card">
            <h2 className="text-xl mb-4">Review Your Listing</h2>

            <div className="mb-6 p-3 rounded-lg border border-blue-200 bg-blue-50 flex gap-3 items-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-blue-900 flex items-center gap-1">
                  AI will verify each book when you submit
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                </p>
                <p className="text-blue-800 mt-0.5">
                  We'll check your photos and grade the condition automatically. This usually takes a few seconds per book — please don't close this page.
                </p>
              </div>
            </div>

            {/* Added Books */}
            {addedBooks.map((book, idx) => (
              <div key={idx} className="mb-6 p-4 border rounded-lg bg-gray-50 relative">
                <h3 className="font-medium text-lg mb-2">Book {idx + 1}: {book.title}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <p>Author: {book.author}</p>
                  <p>Condition: {book.condition}</p>
                  <p>Price/Week: Rs. {book.pricePerWeek}</p>
                  <p>Deposit: Rs. {book.securityDeposit}</p>
                </div>
              </div>
            ))}

            {/* Current Book */}
            <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-100">
              <h3 className="font-medium text-lg mb-2 text-blue-900">Current Book: {formData.title || 'Untitled'}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <p>Author: {formData.author}</p>
                <p>Condition: {formData.condition}</p>
                <p>Price/Week: Rs. {formData.pricePerWeek}</p>
                <p>Deposit: Rs. {formData.securityDeposit}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm text-gray-500 mb-2">Pickup Location (All Books)</h3>
              <p className="text-gray-900">{locationData.address || 'Address not provided'}</p>
              <p className="text-sm text-gray-600">
                {locationData.city}, {locationData.state} - {locationData.pincode}
              </p>
              <p className="text-sm text-gray-600">Phone: {locationData.phone}</p>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={handleAddAnother}
                disabled={addedBooks.length >= 3}
                className="w-full border-dashed border-2 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addedBooks.length >= 3 ? 'Max books reached' : 'Add Another Book'}
              </Button>
            </div>

          </Card>
        )}

        <div className="flex gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 hover:bg-gray-50 transition-smooth"
          >
            Back
          </Button>
          <Button
            onClick={currentStep === 'review' ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale shadow-subtle"
          >
            {isSubmitting
              ? 'Verifying & listing…'
              : currentStep === 'review'
                ? `Verify & List ${addedBooks.length + 1} Book(s)`
                : 'Continue'}
          </Button>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScanComplete={handleScanComplete}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
