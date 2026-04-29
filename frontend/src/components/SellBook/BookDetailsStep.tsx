// Updated src/components/SellBook/BookDetailsStep.tsx
import { useState } from 'react';
import { BookFormData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BookOpen, Search, X, Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { BarcodeScanner } from '../BarcodeScanner';
import { toast } from 'sonner';
import {
  BOOK_PHOTO_SLOT_LABELS,
  BOOK_PHOTO_SLOT_ORDER,
  emptyBookImageSlots,
  validateBookPhotoFile,
  type BookPhotoSlotKey,
} from '../../utils/bookConditionPhotos';

/** Strip separators; keep digits and X (ISBN-10 check digit). */
function normalizeIsbnInput(raw: string): string {
  return raw.replace(/[^0-9X]/gi, '').toUpperCase();
}

function mapRawCategory(raw: string, allowed: string[]): string {
  const r = raw.trim();
  if (!r) return 'Other';
  const lower = r.toLowerCase();
  const exact = allowed.find((c) => c.toLowerCase() === lower);
  if (exact) return exact;
  if (lower.includes('fantasy')) return 'Fantasy';
  if (lower.includes('science fiction') || lower.includes('sci-fi')) return 'Science Fiction';
  if (lower.includes('mystery') || lower.includes('crime')) return 'Mystery';
  if (lower.includes('romance')) return 'Romance';
  if (lower.includes('biograph')) return 'Biography';
  if (lower.includes('histor')) return 'History';
  if (lower.includes('business') || lower.includes('econom')) return 'Business';
  if (lower.includes('self-help') || lower.includes('self help')) return 'Self-Help';
  if (lower.includes('philosoph')) return 'Philosophy';
  if (lower.includes('fiction') && !lower.includes('non-fiction') && !lower.includes('nonfiction')) return 'Fiction';
  if (lower.includes('non-fiction') || lower.includes('nonfiction')) return 'Non-Fiction';
  if (lower.includes('science') || lower.includes('physics') || lower.includes('biology')) return 'Science';
  return 'Other';
}

function mapLangCode(code?: string): string {
  if (!code) return 'English';
  const c = code.toLowerCase().slice(0, 2);
  const m: Record<string, string> = {
    en: 'English',
    ur: 'اردو',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    ar: 'Arabic',
    hi: 'Hindi',
  };
  return m[c] || code.toUpperCase();
}

type LookupPayload = { fields: Partial<BookFormData>; source: 'openlibrary' | 'google' };

async function fetchFromOpenLibrary(cleanIsbn: string, categories: string[]): Promise<LookupPayload | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(cleanIsbn)}&format=json&jscmd=data`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const entry = data[`ISBN:${cleanIsbn}`];
  if (!entry || !entry.title) return null;

  const authors = Array.isArray(entry.authors)
    ? entry.authors.map((a: { name?: string }) => a?.name).filter(Boolean).join(', ')
    : '';
  let publishedYear = '';
  if (entry.publish_date) {
    const m = String(entry.publish_date).match(/(19|20)\d{2}/);
    publishedYear = m ? m[0] : '';
  }
  const pages = entry.number_of_pages != null ? String(entry.number_of_pages) : '';
  let category = 'Other';
  if (Array.isArray(entry.subjects) && entry.subjects.length) {
    const sub = entry.subjects[0];
    const label = typeof sub === 'string' ? sub : sub?.name;
    if (label) category = mapRawCategory(String(label), categories);
  }
  let language = 'English';
  if (Array.isArray(entry.languages) && entry.languages.length) {
    const href = entry.languages[0]?.key || '';
    const code = href.split('/').pop() || '';
    if (code) language = mapLangCode(code.length >= 2 ? code.slice(0, 2) : code);
  }

  return {
    source: 'openlibrary',
    fields: {
      bookName: entry.title,
      author: authors,
      publishedYear,
      pages,
      category,
      language,
    },
  };
}

async function fetchFromGoogleBooks(
  cleanIsbn: string,
  categories: string[]
): Promise<{ result: LookupPayload | null; rateLimited: boolean }> {
  const apiKey = (import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined)?.trim();
  const base = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(cleanIsbn)}`;
  const url = apiKey ? `${base}&key=${encodeURIComponent(apiKey)}` : base;
  const response = await fetch(url);
  if (response.status === 429) {
    return { result: null, rateLimited: true };
  }
  if (!response.ok) {
    return { result: null, rateLimited: false };
  }
  const data = await response.json();
  if (!data.totalItems || !data.items?.[0]) {
    return { result: null, rateLimited: false };
  }
  const bookInfo = data.items[0].volumeInfo;
  const authors = Array.isArray(bookInfo.authors) ? bookInfo.authors.join(', ') : '';
  let publishedYear = '';
  if (bookInfo.publishedDate) {
    const m = String(bookInfo.publishedDate).match(/(19|20)\d{2}/);
    publishedYear = m ? m[0] : bookInfo.publishedDate.split('-')[0] || '';
  }
  const pages = bookInfo.pageCount != null ? String(bookInfo.pageCount) : '';
  const category = bookInfo.categories?.[0]
    ? mapRawCategory(bookInfo.categories[0], categories)
    : 'Other';
  const language = mapLangCode(bookInfo.language);

  return {
    rateLimited: false,
    result: {
      source: 'google',
      fields: {
        bookName: bookInfo.title || '',
        author: authors,
        publishedYear,
        pages,
        language,
        category,
        description: bookInfo.description || '',
      },
    },
  };
}

interface BookDetailsStepProps {
  initialData: BookFormData;
  onNext: (data: BookFormData) => void;
  onCancel: () => void;
  isExchange?: boolean;
}

interface SellImageSlotInputProps {
  slot: BookPhotoSlotKey;
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
}

function SellImageSlotInput({ slot, label, file, onPick }: SellImageSlotInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    setValidating(true);
    const err = await validateBookPhotoFile(picked, label);
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
        file ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
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

export function BookDetailsStep({ initialData, onNext, onCancel, isExchange = false }: BookDetailsStepProps) {
  const [formData, setFormData] = useState<BookFormData>(() => ({
    ...initialData,
    imageSlots: initialData.imageSlots ?? emptyBookImageSlots(),
  }));
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isbnLookup, setIsbnLookup] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const categories = [
    'Fiction',
    'Non-Fiction',
    'Science Fiction',
    'Fantasy',
    'Mystery',
    'Romance',
    'Biography',
    'History',
    'Self-Help',
    'Business',
    'Science',
    'Philosophy',
    'Classic Literature',
    'Other'
  ];

  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const validateISBN = (isbn: string) => {
    const clean = normalizeIsbnInput(isbn);
    
    // Validate ISBN-10 (Legacy) or SBN with a leading 0
    if (clean.length === 10) {
      if (!/^[0-9]{9}[0-9X]$/i.test(clean)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i)) * (10 - i);
      }
      let checkDigit = clean.charAt(9).toUpperCase();
      sum += checkDigit === 'X' ? 10 : parseInt(checkDigit);
      return sum % 11 === 0;
    }
    
    // Validate ISBN-13 (Current Global Standard / EAN-13)
    if (clean.length === 13) {
      if (!/^[0-9]{13}$/.test(clean)) return false;
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(clean.charAt(i)) * (i % 2 === 0 ? 1 : 3);
      }
      let check = 10 - (sum % 10);
      if (check === 10) check = 0;
      return check === parseInt(clean.charAt(12));
    }
    
    return false; // Fails length checks
  };

  const handleISBNLookup = async (isbnOverride?: string) => {
    const isbnToLookup = (isbnOverride || formData.isbn).trim();

    if (!isbnToLookup) {
      setErrors({ ...errors, isbn: 'Please enter an ISBN number first' });
      return;
    }

    if (!validateISBN(isbnToLookup)) {
      setErrors({ ...errors, isbn: 'Invalid ISBN-10 or ISBN-13 (check digits). You can use dashes or spaces.' });
      return;
    }

    setIsbnLookup(true);
    const cleanISBN = normalizeIsbnInput(isbnToLookup);

    try {
      const ol = await fetchFromOpenLibrary(cleanISBN, categories);
      if (ol) {
        setFormData((prev) => ({
          ...prev,
          isbn: isbnToLookup,
          ...ol.fields,
        }));
        setErrors((prev) => ({ ...prev, isbn: '' }));
        return;
      }

      const { result: googleHit, rateLimited } = await fetchFromGoogleBooks(cleanISBN, categories);
      if (googleHit) {
        setFormData((prev) => ({
          ...prev,
          isbn: isbnToLookup,
          ...googleHit.fields,
          description: googleHit.fields.description
            ? googleHit.fields.description
            : prev.description,
        }));
        setErrors((prev) => ({ ...prev, isbn: '' }));
      } else if (rateLimited) {
        setErrors((prev) => ({
          ...prev,
          isbn: 'Google Books is rate-limiting lookups right now. Try again in a minute, or enter details manually. (Tip: set VITE_GOOGLE_BOOKS_API_KEY for a higher quota.)',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          isbn: 'No book found with this ISBN. Enter details manually.',
        }));
      }
    } catch {
      setErrors((prev) => ({
        ...prev,
        isbn: 'Failed to look up this ISBN. Enter details manually.',
      }));
    } finally {
      setIsbnLookup(false);
    }
  };

  const handleScanComplete = (rawIsbn: string) => {
    const cleanIsbn = normalizeIsbnInput(rawIsbn);
    setFormData((prev) => ({ ...prev, isbn: cleanIsbn }));
    setShowScanner(false);
    handleISBNLookup(cleanIsbn);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.isbn.trim()) {
      newErrors.isbn = 'ISBN is required';
    } else if (!validateISBN(formData.isbn)) {
      newErrors.isbn = 'Please enter a valid ISBN-10 or ISBN-13 number';
    }

    if (!formData.bookName.trim()) {
      newErrors.bookName = 'Book name is required';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'Author name is required';
    }

    if (!isExchange) {
      if (!formData.price) {
        newErrors.price = 'Price is required';
      } else if (parseFloat(formData.price) <= 0) {
        newErrors.price = 'Price must be greater than 0';
      } else if (parseFloat(formData.price) > 50000) {
        newErrors.price = 'Price seems unreasonably high';
      }

      if (formData.originalPrice && formData.price) {
        const resalePrice = parseFloat(formData.price);
        const origPrice = parseFloat(formData.originalPrice);

        if (origPrice > 0 && resalePrice > origPrice) {
          newErrors.price = 'Resale price cannot be higher than original price';
        }
      }
    } else {
      if (!formData.exchangePreferences?.trim()) {
        newErrors.exchangePreferences = 'Please specify what you want in exchange';
      }
    }

    if (formData.publishedYear && (parseInt(formData.publishedYear) < 1000 || parseInt(formData.publishedYear) > new Date().getFullYear())) {
      newErrors.publishedYear = 'Please enter a valid year';
    }

    if (formData.pages && parseInt(formData.pages) <= 0) {
      newErrors.pages = 'Pages must be greater than 0';
    }

    const slots = formData.imageSlots ?? emptyBookImageSlots();
    for (const slot of BOOK_PHOTO_SLOT_ORDER) {
      if (!slots[slot]) {
        newErrors.images =
          'Upload all 5 photos: Front, Back, First Page, Last Page, and Page edges (closed book, top or bottom of the page block).';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Ensure the ISBN passed to the parent is fully normalized
      const normalizedData = {
        ...formData,
        isbn: normalizeIsbnInput(formData.isbn),
      };
      onNext(normalizedData);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-[#C4A672]" />
          </div>
          <div>
            <h3 className="text-[#2C3E50]">Book Information</h3>
            <p className="text-gray-600 text-sm">Enter the details of the book you want to {isExchange ? 'exchange' : 'sell'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ISBN */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="isbn">ISBN Number *</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="isbn"
                  type="text"
                  placeholder="9780702047473 or 978-0-7020-4747-3"
                  value={formData.isbn}
                  onChange={(e) => {
                    setFormData({ ...formData, isbn: e.target.value });
                    setErrors({ ...errors, isbn: '' });
                  }}
                  className={errors.isbn ? 'border-red-500' : ''}
                />
                {errors.isbn && (
                  <p className="text-sm text-red-500 mt-1">{errors.isbn}</p>
                )}
              </div>
              <Button
                type="button"
                onClick={() => setShowScanner(true)}
                variant="outline"
                className="px-3"
                title="Scan Barcode"
              >
                <Camera className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={() => handleISBNLookup()}
                disabled={isbnLookup}
                variant="outline"
                className="px-4"
              >
                <Search className="w-4 h-4 mr-2" />
                {isbnLookup ? 'Looking up...' : 'Auto-fill'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              ISBN-10 or ISBN-13 with or without dashes/spaces. Auto-fill tries Open Library first, then Google Books.
            </p>
          </div>

          {/* Book Name */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bookName">Book Title *</Label>
            <Input
              id="bookName"
              type="text"
              placeholder="Enter the book title"
              value={formData.bookName}
              onChange={(e) => {
                setFormData({ ...formData, bookName: e.target.value });
                setErrors({ ...errors, bookName: '' });
              }}
              className={errors.bookName ? 'border-red-500' : ''}
            />
            {errors.bookName && (
              <p className="text-sm text-red-500">{errors.bookName}</p>
            )}
          </div>

          {/* Author */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="author">Author Name *</Label>
            <Input
              id="author"
              type="text"
              placeholder="Enter the author's name"
              value={formData.author}
              onChange={(e) => {
                setFormData({ ...formData, author: e.target.value });
                setErrors({ ...errors, author: '' });
              }}
              className={errors.author ? 'border-red-500' : ''}
            />
            {errors.author && (
              <p className="text-sm text-red-500">{errors.author}</p>
            )}
          </div>

          {/* Price or Exchange Preferences */}
          {!isExchange ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="price">Resale Price (PKR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-500">Rs.</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                      setErrors({ ...errors, price: '' });
                    }}
                    className={`pl-7 ${errors.price ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.originalPrice || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, originalPrice: e.target.value });
                      setErrors({ ...errors, originalPrice: '' });
                    }}
                    className={`pl-7 ${errors.originalPrice ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.originalPrice && (
                  <p className="text-sm text-red-500">{errors.originalPrice}</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="exchangePreferences">Exchange Preferences *</Label>
              <Input
                id="exchangePreferences"
                placeholder="What are you looking for? e.g. 'Sci-Fi books', 'Specific Title'"
                value={formData.exchangePreferences || ''}
                onChange={(e) => {
                  setFormData({ ...formData, exchangePreferences: e.target.value });
                  setErrors({ ...errors, exchangePreferences: '' });
                }}
                className={errors.exchangePreferences ? 'border-red-500' : ''}
              />
              {errors.exchangePreferences && (
                <p className="text-sm text-red-500">{errors.exchangePreferences}</p>
              )}
            </div>
          )}

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="condition">Condition *</Label>
            <Select
              value={formData.condition}
              onValueChange={(value) => setFormData({ ...formData, condition: value })}
            >
              <SelectTrigger id="condition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C4A672]" />
              After you submit, we verify your condition using the 4 photos below (AI check).
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Published Year */}
          <div className="space-y-2">
            <Label htmlFor="publishedYear">Published Year</Label>
            <Input
              id="publishedYear"
              type="number"
              placeholder="2020"
              value={formData.publishedYear}
              onChange={(e) => {
                setFormData({ ...formData, publishedYear: e.target.value });
                setErrors({ ...errors, publishedYear: '' });
              }}
              className={errors.publishedYear ? 'border-red-500' : ''}
            />
            {errors.publishedYear && (
              <p className="text-sm text-red-500">{errors.publishedYear}</p>
            )}
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input
              id="language"
              type="text"
              placeholder="English"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            />
          </div>

          {/* Pages */}
          <div className="space-y-2">
            <Label htmlFor="pages">Number of Pages</Label>
            <Input
              id="pages"
              type="number"
              placeholder="350"
              value={formData.pages}
              onChange={(e) => {
                setFormData({ ...formData, pages: e.target.value });
                setErrors({ ...errors, pages: '' });
              }}
              className={errors.pages ? 'border-red-500' : ''}
            />
            {errors.pages && (
              <p className="text-sm text-red-500">{errors.pages}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the book's condition, any highlighting, notes, or other details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Image Upload — 5 slots for AI condition + library edge check */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Book condition photos *</Label>
              <span className="text-xs font-medium text-gray-500">
                {BOOK_PHOTO_SLOT_ORDER.filter((s) => (formData.imageSlots ?? emptyBookImageSlots())[s]).length}/5
              </span>
            </div>
            <div className="mb-2 p-3 rounded-lg border border-[#C4A672]/30 bg-[#C4A672]/5 flex gap-3 items-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-[#C4A672]/20">
                <ShieldCheck className="w-4 h-4 text-[#C4A672]" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-[#2C3E50] flex items-center gap-1">
                  AI condition verification
                  <Sparkles className="w-3.5 h-3.5 text-[#C4A672]" />
                </p>
                <p className="text-gray-700 mt-0.5">
                  Upload five photos: <span className="font-medium">Front, Back, First Page, Last Page</span>, and{' '}
                  <span className="font-medium">page edges</span> — the closed book shot from the top or bottom so the cut
                  edges of the paper block are visible (library stamps often appear here). AI also flags likely library
                  markings for review. Min 400×400 each, under 5 MB.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BOOK_PHOTO_SLOT_ORDER.map((slot) => (
                <SellImageSlotInput
                  key={slot}
                  slot={slot}
                  label={BOOK_PHOTO_SLOT_LABELS[slot]}
                  file={(formData.imageSlots ?? emptyBookImageSlots())[slot]}
                  onPick={(file) => {
                    setFormData((prev) => ({
                      ...prev,
                      imageSlots: { ...(prev.imageSlots ?? emptyBookImageSlots()), [slot]: file },
                    }));
                    setErrors((e) => ({ ...e, images: '' }));
                  }}
                />
              ))}
            </div>
            {errors.images && (
              <p className="text-sm text-red-500">{errors.images}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8"
          >
            Next: Location & Delivery
          </Button>
        </div>
      </form>

      {showScanner && (
        <BarcodeScanner
          onScanComplete={handleScanComplete}
          onCancel={() => setShowScanner(false)}
        />
      )
      }
    </>
  );
}