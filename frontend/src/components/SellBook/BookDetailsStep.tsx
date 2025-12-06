// Updated src/components/SellBook/BookDetailsStep.tsx
import { useState } from 'react';
import { BookFormData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BookOpen, Search, Upload, X, Camera } from 'lucide-react';
import { BarcodeScanner } from '../BarcodeScanner';

interface BookDetailsStepProps {
  initialData: BookFormData;
  onNext: (data: BookFormData) => void;
  onCancel: () => void;
  isExchange?: boolean;
}

export function BookDetailsStep({ initialData, onNext, onCancel, isExchange = false }: BookDetailsStepProps) {
  const [formData, setFormData] = useState<BookFormData>(initialData);
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
    // Remove hyphens and spaces
    const cleanISBN = isbn.replace(/[-\s]/g, '');

    // Check if it's either ISBN-10 or ISBN-13
    if (cleanISBN.length === 10 || cleanISBN.length === 13) {
      return /^[0-9X]+$/.test(cleanISBN);
    }
    return false;
  };

  const handleISBNLookup = async (isbnOverride?: string) => {
    // Use override if provided (e.g. from scanner), otherwise use state
    const isbnToLookup = isbnOverride || formData.isbn;

    if (!isbnToLookup) {
      setErrors({ ...errors, isbn: 'Please enter an ISBN number first' });
      return;
    }

    if (!validateISBN(isbnToLookup)) {
      setErrors({ ...errors, isbn: 'Invalid ISBN format' });
      return;
    }

    setIsbnLookup(true);
    const cleanISBN = isbnToLookup.replace(/[-\s]/g, '');

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
      const data = await response.json();

      if (data.totalItems > 0) {
        const bookInfo = data.items[0].volumeInfo;
        setFormData(prev => ({
          ...prev,
          isbn: isbnToLookup, // Ensure ISBN is set (important if coming from override)
          bookName: bookInfo.title || '',
          author: bookInfo.authors?.[0] || '',
          publishedYear: bookInfo.publishedDate?.split('-')[0] || '',
          pages: bookInfo.pageCount?.toString() || '',
          language: bookInfo.language?.toUpperCase() || 'English',
          description: bookInfo.description || prev.description
        }));
        // Clear errors if successful
        setErrors(prev => ({ ...prev, isbn: '' }));
      } else {
        setErrors(prev => ({ ...prev, isbn: 'No book found with this ISBN' }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, isbn: 'Failed to lookup ISBN. Please enter details manually.' }));
    } finally {
      setIsbnLookup(false);
    }
  };

  const handleScanComplete = (isbn: string) => {
    setFormData(prev => ({ ...prev, isbn: isbn }));
    setShowScanner(false);
    // Automatically trigger lookup after scan
    handleISBNLookup(isbn);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => URL.createObjectURL(file));

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        imageFiles: [...(prev.imageFiles || []), ...files]
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const newImageFiles = [...(prev.imageFiles || [])];

      newImages.splice(index, 1);
      if (newImageFiles.length > index) {
        newImageFiles.splice(index, 1);
      }

      return {
        ...prev,
        images: newImages,
        imageFiles: newImageFiles
      };
    });
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
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
                  placeholder="978-3-16-148410-0 or 0-306-40615-2"
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
              The ISBN can be found on the back cover or copyright page of the book
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
            <div className="space-y-2">
              <Label htmlFor="price">Resale Price (PKR) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs.</span>
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

          {/* Image Upload */}
          <div className="space-y-2 md:col-span-2">
            <Label>Book Images</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#C4A672] hover:bg-[#C4A672]/5 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Upload clear photos of the front cover, back cover, and any damage.
            </p>
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
      )}
    </>
  );
}