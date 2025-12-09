import { useState } from 'react';
import { RentalBook } from '../RentBookFlow';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Search, SlidersHorizontal, X, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { Badge } from '../ui/badge';

const mockRentalBooks: RentalBook[] = [
  {
    id: '1',
    isbn: '978-3-16-148410-0',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    condition: 'Good',
    category: 'Classic Literature',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'],
    description: 'A classic American novel about justice and racial inequality in the Deep South.',
    seller: {
      name: 'John Doe',
      rating: 4.8,
      location: 'San Francisco, CA'
    },
    rentalOptions: {
      weekly: 2.99,
      monthly: 5.99,
      yearly: 49.99
    },
    deliveryMethods: ['pickup', 'shipping']
  },
  {
    id: '2',
    isbn: '978-0-06-112008-4',
    title: '1984',
    author: 'George Orwell',
    condition: 'New',
    category: 'Fiction',
    images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400', 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400'],
    description: 'A dystopian social science fiction novel and cautionary tale.',
    seller: {
      name: 'Jane Smith',
      rating: 4.9,
      location: 'San Francisco, CA'
    },
    rentalOptions: {
      weekly: 3.99,
      monthly: 7.99,
      yearly: 59.99
    },
    deliveryMethods: ['pickup', 'shipping']
  },
  {
    id: '3',
    isbn: '978-0-7432-7356-5',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    condition: 'Fair',
    category: 'Classic Literature',
    images: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'],
    description: 'The story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.',
    seller: {
      name: 'Mike Johnson',
      rating: 4.5,
      location: 'Oakland, CA'
    },
    rentalOptions: {
      weekly: 1.99,
      monthly: 3.99,
      yearly: 29.99
    },
    deliveryMethods: ['pickup']
  },
  {
    id: '4',
    isbn: '978-0-452-28423-4',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    condition: 'Good',
    category: 'Romance',
    images: ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=400', 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400'],
    description: 'A romantic novel of manners set in Georgian England.',
    seller: {
      name: 'Sarah Williams',
      rating: 5.0,
      location: 'San Jose, CA'
    },
    rentalOptions: {
      weekly: 2.49,
      monthly: 4.99,
      yearly: 39.99
    },
    deliveryMethods: ['pickup', 'shipping']
  },
];

interface RentalBrowseProps {
  onSelectBook: (book: RentalBook) => void;
  onClose: () => void;
}

export function RentalBrowse({ onSelectBook, onClose }: RentalBrowseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isbnSearch, setIsbnSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [rentalPeriod, setRentalPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20]);
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPhotoPreviews, setShowPhotoPreviews] = useState(true);

  // Filter books based on all criteria
  const filteredBooks = mockRentalBooks.filter(book => {
    // Text search (title, author, ISBN)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      book.isbn.toLowerCase().includes(searchLower);

    // ISBN specific search
    const matchesISBN = isbnSearch === '' || book.isbn.includes(isbnSearch);

    // Category filter
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;

    // Condition filter
    const matchesCondition = conditionFilter === 'all' || book.condition === conditionFilter;

    // Price range filter (based on selected rental period)
    const bookPrice = book.rentalOptions[rentalPeriod];
    const matchesPrice = bookPrice >= priceRange[0] && bookPrice <= priceRange[1];

    // Location filter
    const matchesLocation = locationFilter === '' ||
      book.seller.location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesISBN && matchesCategory && matchesCondition && matchesPrice && matchesLocation;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setIsbnSearch('');
    setCategoryFilter('all');
    setConditionFilter('all');
    setRentalPeriod('monthly');
    setPriceRange([0, 20]);
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
                  <SelectItem value="Fiction">Fiction</SelectItem>
                  <SelectItem value="Classic Literature">Classic Literature</SelectItem>
                  <SelectItem value="Romance">Romance</SelectItem>
                  <SelectItem value="Mystery">Mystery</SelectItem>
                  <SelectItem value="Science Fiction">Science Fiction</SelectItem>
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
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
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
                    {rentalPeriod.charAt(0).toUpperCase() + rentalPeriod.slice(1)} Price Range:
                    <span className="text-[#C4A672] ml-2">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={20}
                    step={0.5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Rs. 0</span>
                    <span>Rs. 20</span>
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
                  <Badge variant="secondary">Period: {rentalPeriod}</Badge>
                  <Badge variant="secondary">Price: ${priceRange[0]}-${priceRange[1]}</Badge>
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
            Showing {rentalPeriod} rates
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
                    <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" />
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
                      book.condition === 'New' ? 'bg-green-100 text-green-800' :
                        book.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                    }>
                      {book.condition}
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
                          ${book.rentalOptions.weekly}/wk
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className={rentalPeriod === 'monthly' ? 'text-[#C4A672] font-medium' : 'text-gray-800'}>
                          ${book.rentalOptions.monthly}/mo
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Yearly:</span>
                        <span className={rentalPeriod === 'yearly' ? 'text-[#C4A672] font-medium' : 'text-gray-800'}>
                          ${book.rentalOptions.yearly}/yr
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