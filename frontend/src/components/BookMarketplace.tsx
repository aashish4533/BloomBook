import { useState } from 'react';
import { BookCard } from './BookCard';
import { BookDetailModal } from './BookDetailModal';
import { SellBookFlow } from './SellBookFlow';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Search, SlidersHorizontal, Plus, MapPin, X, ArrowLeft } from 'lucide-react';

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  category: string;
  description: string;
  seller: {
    name: string;
    rating: number;
    totalSales: number;
    avatar: string;
  };
  images: string[];
  publishedYear: number;
  isbn: string;
  language: string;
  pages: number;
}

const mockBooks: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    price: 12.99,
    condition: 'Good',
    category: 'Classic Literature',
    description: 'A classic novel set in the Jazz Age that explores themes of wealth, love, and the American Dream. This edition is in good condition with minimal wear on the cover.',
    seller: {
      name: 'Sarah Johnson',
      rating: 4.8,
      totalSales: 156,
      avatar: 'SJ'
    },
    images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'],
    publishedYear: 1925,
    isbn: '978-0-7432-7356-5',
    language: 'English',
    pages: 180
  },
  {
    id: '2',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    price: 15.50,
    condition: 'Like New',
    category: 'Classic Literature',
    description: 'An American classic that deals with serious issues of rape and racial inequality. The book is in excellent condition, barely read.',
    seller: {
      name: 'Michael Chen',
      rating: 4.9,
      totalSales: 203,
      avatar: 'MC'
    },
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'],
    publishedYear: 1960,
    isbn: '978-0-06-112008-4',
    language: 'English',
    pages: 324
  },
  {
    id: '3',
    title: '1984',
    author: 'George Orwell',
    price: 10.99,
    condition: 'Good',
    category: 'Science Fiction',
    description: 'A dystopian social science fiction novel and cautionary tale. Some highlighting on a few pages but overall in good reading condition.',
    seller: {
      name: 'Emma Davis',
      rating: 4.7,
      totalSales: 89,
      avatar: 'ED'
    },
    images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'],
    publishedYear: 1949,
    isbn: '978-0-452-28423-4',
    language: 'English',
    pages: 328
  },
  {
    id: '4',
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    price: 13.99,
    condition: 'Good',
    category: 'Classic Literature',
    description: 'A story about teenage rebellion and alienation. Clean pages with minor shelf wear on the cover.',
    seller: {
      name: 'David Wilson',
      rating: 4.6,
      totalSales: 124,
      avatar: 'DW'
    },
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'],
    publishedYear: 1951,
    isbn: '978-0-316-76948-0',
    language: 'English',
    pages: 277
  },
  {
    id: '5',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    price: 11.99,
    condition: 'Like New',
    category: 'Romance',
    description: 'A romantic novel of manners that critiques the British landed gentry. Pristine condition, read once.',
    seller: {
      name: 'Lisa Anderson',
      rating: 5.0,
      totalSales: 178,
      avatar: 'LA'
    },
    images: ['https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400'],
    publishedYear: 1813,
    isbn: '978-0-14-143951-8',
    language: 'English',
    pages: 432
  },
  {
    id: '6',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    price: 16.99,
    condition: 'Good',
    category: 'Fantasy',
    description: 'A fantasy novel about the adventures of Bilbo Baggins. Well-loved copy with some creasing on the spine.',
    seller: {
      name: 'Robert Taylor',
      rating: 4.8,
      totalSales: 145,
      avatar: 'RT'
    },
    images: ['https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400'],
    publishedYear: 1937,
    isbn: '978-0-547-92822-7',
    language: 'English',
    pages: 310
  },
  {
    id: '7',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    price: 14.99,
    condition: 'Good',
    category: 'Fantasy',
    description: 'First book in the beloved Harry Potter series. Pages are clean with minor cover wear.',
    seller: {
      name: 'Jennifer Martinez',
      rating: 4.9,
      totalSales: 267,
      avatar: 'JM'
    },
    images: ['https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400'],
    publishedYear: 1997,
    isbn: '978-0-590-35340-3',
    language: 'English',
    pages: 309
  },
  {
    id: '8',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    price: 12.50,
    condition: 'Like New',
    category: 'Philosophy',
    description: 'A philosophical book about following your dreams. Excellent condition, minimal signs of use.',
    seller: {
      name: 'Carlos Rodriguez',
      rating: 4.7,
      totalSales: 112,
      avatar: 'CR'
    },
    images: ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=400'],
    publishedYear: 1988,
    isbn: '978-0-06-231500-7',
    language: 'English',
    pages: 163
  }
];

interface BookMarketplaceProps {
  onBack?: () => void;
}

export function BookMarketplace({ onBack }: BookMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isbnFilter, setIsbnFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showSellFlow, setShowSellFlow] = useState(false);

  const categories = ['all', 'Classic Literature', 'Science Fiction', 'Romance', 'Fantasy', 'Philosophy', 'Textbooks', 'Mystery', 'Biography'];
  const conditions = ['all', 'New', 'Like New', 'Good', 'Fair', 'Poor'];

  const filteredBooks = mockBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
    const matchesCondition = conditionFilter === 'all' || book.condition === conditionFilter;
    const matchesIsbn = !isbnFilter || book.isbn.includes(isbnFilter);
    const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesCondition && matchesIsbn && matchesPrice;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.seller.rating - a.seller.rating;
      case 'recent':
      default:
        return 0; // In a real app, we'd sort by date
    }
  });

  const activeFiltersCount = [
    categoryFilter !== 'all',
    conditionFilter !== 'all',
    isbnFilter !== '',
    locationFilter !== '',
    priceRange[0] > 0 || priceRange[1] < 50
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setCategoryFilter('all');
    setConditionFilter('all');
    setIsbnFilter('');
    setLocationFilter('');
    setPriceRange([0, 50]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              )}
              <h1 className="text-3xl font-bold text-[#2C3E50]">Book Marketplace</h1>
            </div>
            <p className="text-gray-600">Buy and sell textbooks and literature within your community</p>
          </div>
          <Button
            onClick={() => setShowSellFlow(true)}
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Sell a Book
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Condition Filter */}
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map(condition => (
                  <SelectItem key={condition} value={condition}>
                    {condition === 'all' ? 'All Conditions' : condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-[#C4A672]"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-[#C4A672] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600"
              >
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ISBN Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">ISBN Number</label>
                  <Input
                    type="text"
                    placeholder="Enter ISBN..."
                    value={isbnFilter}
                    onChange={(e) => setIsbnFilter(e.target.value)}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-700">Location / Seller</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by location or seller..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-9 bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-2">
                <label className="text-sm text-gray-700">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  min={0}
                  max={50}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>$50+</span>
                </div>
              </div>
            </div>
          )}

          {/* Sort and Results Count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              {sortedBooks.length} {sortedBooks.length === 1 ? 'book' : 'books'} found
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 h-9 bg-gray-50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Seller Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Book Grid */}
        {sortedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No books found matching your criteria</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setConditionFilter('all');
              }}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Book Detail Modal */}
        {selectedBook && (
          <BookDetailModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}

        {/* Sell Book Flow */}
        {showSellFlow && (
          <SellBookFlow onClose={() => setShowSellFlow(false)} />
        )}
      </div>
    </div>
  );
}