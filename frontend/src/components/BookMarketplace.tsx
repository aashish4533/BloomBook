import { useState, useEffect } from 'react';
import { BookCard } from './BookCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Search, SlidersHorizontal, Plus, MapPin, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { db } from '../firebase';
import { useWishlist } from '../hooks/useWishlist';
import { collection, query, orderBy, limit, startAfter, where, getDocs, DocumentSnapshot, QueryConstraint } from 'firebase/firestore';

function normalizeIsbn(s: string) {
  return s.replace(/[\s-]/g, '').toLowerCase();
}

/** Align marketplace condition filter with Firestore values (e.g. GiveBooksOnRent: new, good, fair, excellent). */
function conditionMatchesFilter(bookCondition: string | undefined, filter: string): boolean {
  if (filter === 'all') return true;
  const b = (bookCondition || '').toLowerCase().trim();
  const f = filter.toLowerCase().trim();
  if (b === f) return true;
  if (f === 'new' || f === 'like new') {
    return b === 'new' || b === 'like new' || b === 'excellent';
  }
  if (f === 'good') return b === 'good';
  if (f === 'fair') return b === 'fair';
  if (f === 'poor') return b === 'poor';
  return false;
}

function effectiveListPrice(book: Book): number {
  if (book.availableFor?.includes('sale')) return Number(book.price) || 0;
  if (book.availableFor?.includes('rent')) return Number(book.rentPrice ?? book.price) || 0;
  return Number(book.price) || 0;
}

function isMarketplaceVisible(book: Book): boolean {
  if (book.isSold === true) return false;
  if (book.listingStatus === 'sold') return false;
  if (book.listingStatus === 'reserved') return false;
  if (book.status != null && book.status !== '' && book.status !== 'active') return false;
  return true;
}

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
  listingStatus?: 'available' | 'reserved' | 'sold';
  reservedBy?: string;
  reservedUntil?: { toDate: () => Date } | Date | null;
  reservationPurchaseId?: string;
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
  const routeState = location.state as {
    pickForWishlist?: boolean;
    wishlistType?: string;
    wishlistReturnTo?: string;
  } | null;
  const pickForWishlist = Boolean(routeState?.pickForWishlist);
  const wishlistType: 'buy' | 'rent' | 'exchange' =
    routeState?.wishlistType === 'rent'
      ? 'rent'
      : routeState?.wishlistType === 'exchange'
        ? 'exchange'
        : 'buy';
  const wishlistReturnTo = routeState?.wishlistReturnTo;
  const { toggleWishlist } = useWishlist();
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
 
      if (listingType !== 'all') {
        const typeSearch = listingType === 'sell' ? 'sale' : listingType;
        constraints.push(where('availableFor', 'array-contains', typeSearch));
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
  }, [categoryFilter, sortBy, listingType]);

  // Client-side filtering for fields that are too complex for simple Firestore queries without many indexes
  // or text search (which Firestore doesn't natively support well for partial matches)
  const filteredBooks = books.filter(book => {
    if (!isMarketplaceVisible(book)) return false;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      book.title?.toLowerCase().includes(q) ||
      book.author?.toLowerCase().includes(q);

    const matchesCondition = conditionMatchesFilter(book.condition, conditionFilter);

    const isbnNeedle = normalizeIsbn(isbnFilter.trim());
    const matchesIsbn =
      !isbnNeedle || normalizeIsbn(book.isbn || '').includes(isbnNeedle);

    const listPrice = effectiveListPrice(book);
    const matchesPrice = listPrice >= priceRange[0] && listPrice <= priceRange[1];

    const loc = locationFilter.trim().toLowerCase();
    const matchesLocation =
      !loc ||
      book.seller?.name?.toLowerCase().includes(loc) ||
      book.location?.city?.toLowerCase().includes(loc) ||
      book.location?.state?.toLowerCase().includes(loc) ||
      String(book.location?.zipCode || '')
        .toLowerCase()
        .includes(loc);

    const matchesType =
      listingType === 'all'
        ? true
        : book.availableFor?.includes(listingType === 'sell' ? 'sale' : listingType);

    return (
      matchesSearch &&
      matchesCondition &&
      matchesIsbn &&
      matchesPrice &&
      matchesLocation &&
      matchesType
    );
  });

  const activeFiltersCount = [
    categoryFilter !== 'all',
    conditionFilter !== 'all',
    isbnFilter !== '',
    locationFilter !== '',
    priceRange[0] > 0 || priceRange[1] < 5000
  ].filter(Boolean).length;

  const handleBookSelect = async (book: Book) => {
    if (pickForWishlist) {
      const canBuy =
        book.availableFor?.includes('sale') || book.type === 'sell' || book.type === 'both';
      const canRent =
        book.availableFor?.includes('rent') || book.type === 'rent' || book.type === 'both';
      const canExchange =
        book.availableFor?.includes('exchange') || book.type === 'exchange';
      if (wishlistType === 'rent' && !canRent) {
        toast.error('This book is not listed for rent');
        return;
      }
      if (wishlistType === 'buy' && !canBuy) {
        toast.error('This book is not listed for sale');
        return;
      }
      if (wishlistType === 'exchange' && !canExchange) {
        toast.error('This book is not listed for exchange');
        return;
      }
      const ok = await toggleWishlist(book, { forceType: wishlistType, mode: 'add' });
      if (ok) navigate(wishlistReturnTo || '/wishlist', { replace: true });
      return;
    }
    navigate(`/book/${book.id}`);
  };

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
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 lg:px-8 w-full min-w-0 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="-ml-2">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C3E50] break-words">Book Marketplace</h1>
            </div>
            <p className="text-gray-600">Buy and sell textbooks and literature within your community</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link to="/rent" className="flex-1 min-w-[8rem] sm:flex-initial">
              <Button className="bg-[#C4A672] hover:bg-[#8B7355] text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Rent
              </Button>
            </Link>
            <Link to="/exchange" className="flex-1 min-w-[8rem] sm:flex-initial">
              <Button variant="outline" className="border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672] hover:text-white w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Exchange
              </Button>
            </Link>
          </div>
        </div>

        {pickForWishlist && (
          <div className="mb-6 rounded-lg border border-[#C4A672] bg-amber-50 px-4 py-3 text-[#2C3E50] text-sm">
            Select a book to add it to your{' '}
            {wishlistType === 'rent' ? 'rent' : wishlistType === 'exchange' ? 'exchange' : 'buy'} wishlist.
          </div>
        )}

        {/* Listing Type Tabs */}
        <div className="flex justify-center mb-6 w-full overflow-x-auto pb-1 -mx-1 px-1">
          <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex flex-wrap justify-center gap-1 max-w-full">
            {['all', 'sell', 'rent', 'exchange'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setListingType(type as any)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${listingType === type ? 'bg-[#C4A672] text-white' : 'text-gray-600 hover:bg-gray-50'
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => handleBookSelect(book)} />
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