import { useState, useEffect } from 'react';
import { BookCard } from './BookCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Search, SlidersHorizontal, Plus, MapPin, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, startAfter, where, getDocs, DocumentSnapshot, QueryConstraint } from 'firebase/firestore';

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
    id?: string;
  };
  images: string[];
  publishedYear: number;
  isbn: string;
  language: string;
  pages: number;

  type: 'sell' | 'rent' | 'exchange' | 'both';
  availableFor: ('sale' | 'rent' | 'exchange')[];
  rentPrice?: number;
  rentDuration?: string;
  exchangePreferences?: string[];
  isSold?: boolean;
  isRented?: boolean;
  userId: string;
  createdAt?: any;
  location?: {
    city: string;
    state: string;
    zipCode: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface BookMarketplaceProps {
  onBack?: () => void;
}

export function BookMarketplace({ onBack }: BookMarketplaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [books, setBooks] = useState<Book[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(location.state?.category || 'all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isbnFilter, setIsbnFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('recent');
  const [listingType, setListingType] = useState<'all' | 'sell' | 'rent' | 'exchange'>('all');

  const categories = [
    'all',
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
    'Textbooks',
    'Other'
  ];
  const conditions = ['all', 'New', 'Like New', 'Good', 'Fair', 'Poor'];

  const fetchBooks = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const booksRef = collection(db, 'books');
      let constraints: QueryConstraint[] = [];

      // Backend Filtering
      if (categoryFilter !== 'all') {
        constraints.push(where('category', '==', categoryFilter));
      }

      // Sorting
      // Note: 'price' sort requires an index if combined with 'category' filter
      if (sortBy === 'recent') {
        constraints.push(orderBy('createdAt', 'desc'));
      } else if (sortBy === 'price-low') {
        constraints.push(orderBy('price', 'asc'));
      } else if (sortBy === 'price-high') {
        constraints.push(orderBy('price', 'desc'));
      }

      // Pagination
      if (isLoadMore && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(20));

      const q = query(booksRef, ...constraints);
      const snapshot = await getDocs(q);

      const newBooks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Book));

      if (isLoadMore) {
        setBooks(prev => [...prev, ...newBooks]);
      } else {
        setBooks(newBooks);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 20);

    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch and when core backend filters change
  useEffect(() => {
    fetchBooks(false);
  }, [categoryFilter, sortBy]);

  // Client-side filtering for fields that are too complex for simple Firestore queries without many indexes
  // or text search (which Firestore doesn't natively support well for partial matches)
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCondition = conditionFilter === 'all' || book.condition === conditionFilter;
    const matchesIsbn = !isbnFilter || book.isbn?.includes(isbnFilter);
    const matchesPrice = book.price >= priceRange[0] && book.price <= priceRange[1];

    // Updated filtering logic using availableFor
    const matchesType = listingType === 'all'
      ? true
      : book.availableFor?.includes(listingType === 'sell' ? 'sale' : listingType);

    return matchesSearch && matchesCondition && matchesIsbn && matchesPrice && matchesType;
  });

  const activeFiltersCount = [
    categoryFilter !== 'all',
    conditionFilter !== 'all',
    isbnFilter !== '',
    locationFilter !== '',
    priceRange[0] > 0 || priceRange[1] < 5000
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setCategoryFilter('all');
    setConditionFilter('all');
    setIsbnFilter('');
    setLocationFilter('');
    setPriceRange([0, 5000]);
    setSearchQuery('');
    setListingType('all');
    setSortBy('recent');
  };

  if (loading && !loadingMore && books.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading books...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="-ml-2">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-3xl font-bold text-[#2C3E50]">Book Marketplace</h1>
            </div>
            <p className="text-gray-600">Buy and sell textbooks and literature within your community</p>
          </div>
          <div className="flex gap-2">
            <Link to="/rent">
              <Button className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Rent
              </Button>
            </Link>
            <Link to="/exchange">
              <Button variant="outline" className="border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672] hover:text-white">
                <Plus className="w-4 h-4 mr-2" />
                Exchange
              </Button>
            </Link>
          </div>
        </div>

        {/* Listing Type Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex">
            {['all', 'sell', 'rent', 'exchange'].map((type) => (
              <button
                key={type}
                onClick={() => setListingType(type as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${listingType === type ? 'bg-[#C4A672] text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {type === 'all' ? 'All Books' : type.charAt(0).toUpperCase() + type.slice(1) + (type === 'sell' ? ' (Sale)' : '')}
              </button>
            ))}
          </div>
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
                  Price Range: Rs. {priceRange[0]} - Rs. {priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={(value: number[]) => setPriceRange(value as [number, number])}
                  min={0}
                  max={5000}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Rs. 0</span>
                  <span>Rs. 5000+</span>
                </div>
              </div>
            </div>
          )}

          {/* Sort and Results Count */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-gray-600">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
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
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Book Grid */}
        {filteredBooks.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map(book => (
                <div key={book.id} onClick={() => navigate(`/book/${book.id}`)} className="cursor-pointer">
                  <BookCard
                    book={book}
                    onClick={() => navigate(`/book/${book.id}`)}
                  />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  onClick={() => fetchBooks(true)}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  {loadingMore ? 'Loading more...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No books found matching your criteria</p>
            <Button
              onClick={clearAllFilters}
              variant="outline"
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}