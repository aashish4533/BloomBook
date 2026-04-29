import { useState, useEffect, useMemo } from 'react';
import { RentalBook } from '../RentBookFlow';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Search, SlidersHorizontal, X, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  collection,
  query,
  where,
  getDocs,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../../firebase';

interface RentalBrowseProps {
  onSelectBook: (book: RentalBook) => void;
  onClose: () => void;
}

/** Local row with location string for filtering (city, state, zip, address). */
type BrowseBookRow = RentalBook & { searchLocation: string };

function normalizeIsbn(s: string) {
  return s.replace(/[\s-]/g, '').toLowerCase();
}

function conditionSelectLabel(value: string) {
  const v = value.toLowerCase();
  if (v === 'new') return 'Like New';
  if (v === 'excellent') return 'Excellent';
  if (v === 'good') return 'Good';
  if (v === 'fair') return 'Fair';
  return value;
}

export function RentalBrowse({ onSelectBook, onClose }: RentalBrowseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isbnSearch, setIsbnSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [rentalPeriod, setRentalPeriod] = useState<'all' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20]);
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPhotoPreviews, setShowPhotoPreviews] = useState(true);
  const [books, setBooks] = useState<BrowseBookRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const qRent = query(collection(db, 'books'), where('availableFor', 'array-contains', 'rent'));
        const qType = query(collection(db, 'books'), where('type', '==', 'rent'));
        const [snapRent, snapType] = await Promise.all([getDocs(qRent), getDocs(qType)]);
        const byId = new Map<string, QueryDocumentSnapshot<DocumentData>>();
        snapRent.docs.forEach((d) => byId.set(d.id, d));
        snapType.docs.forEach((d) => {
          if (!byId.has(d.id)) byId.set(d.id, d);
        });

        const fetchedBooks: BrowseBookRow[] = Array.from(byId.values())
          .filter((doc) => {
            const data = doc.data();
            if (data.isSold === true) return false;
            const st = data.status || 'active';
            if (st !== 'active') return false;
            const forRent =
              (Array.isArray(data.availableFor) && data.availableFor.includes('rent')) ||
              data.type === 'rent';
            return forRent;
          })
          .map((doc) => {
          const data = doc.data();
          const pricePerWeek = Number(data.pricePerWeek) || 0;
          const city = data.location?.city || '';
          const state = data.location?.state || '';
          const zip = data.location?.zipCode || '';
          const addr = data.location?.address || '';
          const searchLocation = [city, state, zip, addr].filter(Boolean).join(' ').toLowerCase();
          return {
            id: doc.id,
            isbn: data.isbn || '',
            title: data.title || 'Untitled',
            author: data.author || 'Unknown Author',
            condition: data.condition || 'good',
            category: data.category || 'General',
            images: data.images || [],
            description: data.description || 'No description available.',
            userId: data.userId,
            searchLocation,
            seller: {
              id: data.userId,
              name: data.seller?.name || 'Unknown Seller',
              rating: data.seller?.rating || 4.5,
              location: city || 'Unknown Location'
            },
            rentalOptions: {
              weekly: pricePerWeek,
              monthly: pricePerWeek * 4, // Approximation
              yearly: pricePerWeek * 52 // Approximation
            },
            deliveryMethods: data.deliveryMethods || ['pickup'],
            // Additional fields from the instruction's RentalBook mapping
            cover: data.images?.[0] || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=300',
            rating: data.seller?.rating || 4.5, // Default rating if missing
            reviews: 0, // Default
            distance: '5 miles', // Placeholder distance
            originalPrice: data.originalPrice || 0,
            securityDeposit: data.securityDeposit || 0,
            available: true, // Assuming active status means available
            availableFor: data.availableFor || []
          };
        });

        let rentMax = 20;
        for (const b of fetchedBooks) {
          rentMax = Math.max(rentMax, b.rentalOptions.weekly, b.rentalOptions.monthly, b.rentalOptions.yearly);
        }
        const sliderMax = Math.min(50000, Math.max(20, Math.ceil(rentMax * 1.1)));
        setBooks(fetchedBooks);
        setPriceRange([0, sliderMax]);
      } catch (error) {
        console.error("Error fetching rental books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const priceSliderMax = useMemo(() => {
    let max = 20;
    for (const b of books) {
      max = Math.max(max, b.rentalOptions.weekly, b.rentalOptions.monthly, b.rentalOptions.yearly);
    }
    return Math.min(50000, Math.max(20, Math.ceil(max * 1.1)));
  }, [books]);

  const priceStep = priceSliderMax > 200 ? 1 : 0.5;

  const uniqueCategories = useMemo(() => {
    const s = new Set<string>();
    books.forEach((b) => {
      if (b.category) s.add(b.category);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [books]);

  const uniqueConditions = useMemo(() => {
    const s = new Set<string>();
    books.forEach((b) => {
      if (b.condition) s.add(String(b.condition));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [books]);

  // Filter books based on all criteria
  const filteredBooks = books.filter(book => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q);

    const isbnQ = normalizeIsbn(isbnSearch.trim());
    const matchesISBN = isbnQ === '' || normalizeIsbn(book.isbn).includes(isbnQ);

    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;

    const matchesCondition =
      conditionFilter === 'all' ||
      book.condition.toLowerCase() === conditionFilter.toLowerCase();

    const [lo, hi] = priceRange;
    const inPriceRange = (p: number) => p >= lo && p <= hi;
    const matchesPrice =
      rentalPeriod === 'all'
        ? inPriceRange(book.rentalOptions.weekly) ||
          inPriceRange(book.rentalOptions.monthly) ||
          inPriceRange(book.rentalOptions.yearly)
        : inPriceRange(book.rentalOptions[rentalPeriod]);

    const locQ = locationFilter.trim().toLowerCase();
    const matchesLocation =
      locQ === '' ||
      book.searchLocation.includes(locQ) ||
      book.seller.location.toLowerCase().includes(locQ);

    return matchesSearch && matchesISBN && matchesCategory && matchesCondition && matchesPrice && matchesLocation;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setIsbnSearch('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setRentalPeriod('all');
    setPriceRange([0, priceSliderMax]);
    setLocationFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[#2C3E50] text-2xl mb-1">Rent Books</h1>
            <p className="text-gray-600">Borrow books for as long as you need</p>
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="w-5 h-5 mr-2" />
            Close
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          {/* Primary Search Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Main Search */}
            <div className="lg:col-span-2">
              <label className="text-sm text-gray-700 mb-1 block">Search Books</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* ISBN Search */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">ISBN</label>
              <Input
                type="text"
                placeholder="978-3-16-148410-0"
                value={isbnSearch}
                onChange={(e) => setIsbnSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Condition Filter */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Condition</label>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {uniqueConditions.map((cond) => (
                    <SelectItem key={cond} value={cond}>
                      {conditionSelectLabel(cond)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rental Period */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Rental Period</label>
              <Select value={rentalPeriod} onValueChange={(value: any) => setRentalPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="City or ZIP code"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
            </Button>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhotoPreviews}
                  onChange={(e) => setShowPhotoPreviews(e.target.checked)}
                  className="w-4 h-4"
                />
                <ImageIcon className="w-4 h-4" />
                Show Photo Previews
              </label>
              <span className="text-sm text-gray-500">
                {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Range Slider */}
                <div>
                  <label className="text-sm text-gray-700 mb-3 block">
                    {rentalPeriod === 'all'
                      ? 'Price range (weekly, monthly, or yearly rate)'
                      : `${rentalPeriod.charAt(0).toUpperCase() + rentalPeriod.slice(1)} price`}
                    :
                    <span className="text-[#C4A672] ml-2">
                      Rs. {priceRange[0]} - Rs. {priceRange[1]}
                    </span>
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={priceSliderMax}
                    step={priceStep}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Rs. 0</span>
                    <span>Rs. {priceSliderMax}</span>
                  </div>
                </div>

                {/* Location Proximity */}
                <div>
                  <label className="text-sm text-gray-700 mb-3 block">
                    Location Proximity
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C4A672]" />
                      <span className="text-sm text-gray-600">
                        {locationFilter || 'All locations'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter a city or ZIP code above to filter by location
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm text-blue-900 mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary">Search: {searchQuery}</Badge>
                  )}
                  {isbnSearch && (
                    <Badge variant="secondary">ISBN: {isbnSearch}</Badge>
                  )}
                  {categoryFilter !== 'all' && (
                    <Badge variant="secondary">Category: {categoryFilter}</Badge>
                  )}
                  {conditionFilter !== 'all' && (
                    <Badge variant="secondary">Condition: {conditionFilter}</Badge>
                  )}
                  {locationFilter && (
                    <Badge variant="secondary">Location: {locationFilter}</Badge>
                  )}
                  {rentalPeriod !== 'all' && (
                    <Badge variant="secondary">Period: {rentalPeriod}</Badge>
                  )}
                  {(priceRange[0] > 0 || priceRange[1] < priceSliderMax) && (
                    <Badge variant="secondary">Price: Rs. {priceRange[0]}-{priceRange[1]}</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[#2C3E50] text-xl">
            Available for Rent ({filteredBooks.length})
          </h2>
          <div className="text-sm text-gray-600">
            {rentalPeriod === 'all' ? 'Showing all rates' : `Showing ${rentalPeriod} rates`}
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Book Image with Photo Count */}
                {showPhotoPreviews && (
                  <div className="h-48 bg-gray-200 overflow-hidden relative">
                    <img
                      src={book.images[0] || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=600'}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                    {book.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {book.images.length} photos
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4">
                  {/* Title and Condition */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-[#2C3E50] mb-1 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                    </div>
                    <Badge className={
                      (() => {
                        const c = book.condition.toLowerCase();
                        if (c === 'new' || c === 'excellent') return 'bg-green-100 text-green-800';
                        if (c === 'good') return 'bg-blue-100 text-blue-800';
                        return 'bg-yellow-100 text-yellow-800';
                      })()
                    }>
                      {conditionSelectLabel(book.condition)}
                    </Badge>
                  </div>

                  {/* ISBN */}
                  <p className="text-xs text-gray-500 mb-3">ISBN: {book.isbn}</p>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{book.seller.location}</span>
                  </div>

                  {/* Rental Options */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Rental Options
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Weekly:</span>
                        <span className={rentalPeriod === 'weekly' ? 'text-[#C4A672] font-medium' : 'text-gray-800'}>
                          Rs. {book.rentalOptions.weekly}/wk
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className={rentalPeriod === 'monthly' ? 'text-[#C4A672] font-medium' : 'text-gray-800'}>
                          Rs. {book.rentalOptions.monthly}/mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Yearly:</span>
                        <span className={rentalPeriod === 'yearly' ? 'text-[#C4A672] font-medium' : 'text-gray-800'}>
                          Rs. {book.rentalOptions.yearly}/yr
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <Button
                    onClick={() => onSelectBook(book)}
                    className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  >
                    View Details & Rent
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-[#2C3E50] text-xl mb-2">No books found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}