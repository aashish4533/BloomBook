import { useState } from 'react';
import { BookFormData } from '../SellBookFlow';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BookOpen, Search } from 'lucide-react';

interface BookDetailsStepProps {
  initialData: BookFormData;
  onNext: (data: BookFormData) => void;
  onCancel: () => void;
}

export function BookDetailsStep({ initialData, onNext, onCancel }: BookDetailsStepProps) {
  const [formData, setFormData] = useState<BookFormData>(initialData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isbnLookup, setIsbnLookup] = useState(false);

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

  const handleISBNLookup = () => {
    if (!formData.isbn) {
      setErrors({ ...errors, isbn: 'Please enter an ISBN number first' });
      return;
    }

    if (!validateISBN(formData.isbn)) {
      setErrors({ ...errors, isbn: 'Invalid ISBN format' });
      return;
    }

    setIsbnLookup(true);
    
    // Simulate API lookup
    setTimeout(() => {
      setFormData({
        ...formData,
        bookName: 'Sample Book Title',
        author: 'Sample Author',
        publishedYear: '2020',
        pages: '350',
        language: 'English'
      });
      setIsbnLookup(false);
    }, 1000);
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

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    } else if (parseFloat(formData.price) > 10000) {
      newErrors.price = 'Price seems unreasonably high';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[#C4A672]" />
        </div>
        <div>
          <h3 className="text-[#2C3E50]">Book Information</h3>
          <p className="text-gray-600 text-sm">Enter the details of the book you want to sell</p>
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
              onClick={handleISBNLookup}
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

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Resale Price (USD) *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
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
            placeholder="Describe the book's condition, any highlighting, notes, or other details buyers should know..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
          <p className="text-xs text-gray-500">
            {formData.description.length}/500 characters
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
  );
}
