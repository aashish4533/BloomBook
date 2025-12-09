import { Badge } from './ui/badge';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Image as ImageIcon,
  SlidersHorizontal,
  CheckCircle,
  BookOpen
} from 'lucide-react';

export function RentalBrowseShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#2C3E50] text-4xl mb-4">
            Rent a Book - Complete Search & Browse
          </h1>
          <p className="text-gray-600 text-xl">
            Advanced filtering system with all requested features
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Book Details Search */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-[#2C3E50] text-xl mb-3">Book Details Search</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Search by title, author, or ISBN</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Dedicated ISBN search field</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Real-time filtering</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Category dropdown</span>
              </li>
            </ul>
          </div>

          {/* Rental Price Options */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-[#2C3E50] text-xl mb-3">Rental Price Options</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Weekly, Monthly, Yearly rates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Price range slider (Rs. 0-Rs. 20)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Period selector dropdown</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Selected rate highlighted</span>
              </li>
            </ul>
          </div>

          {/* Location & Condition */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-[#2C3E50] text-xl mb-3">Location & Condition</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>City or ZIP code search</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Location proximity filtering</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Condition filter (New/Good/Fair)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Color-coded badges</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Filter Layout Visual */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
            <SlidersHorizontal className="w-7 h-7 text-[#C4A672]" />
            Complete Filter System
          </h2>

          {/* Primary Row */}
          <div className="mb-4">
            <h4 className="text-sm text-gray-600 mb-3">Primary Search Row:</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2 border-2 border-[#C4A672] rounded-lg p-3 bg-[#C4A672]/5">
                <label className="text-xs text-gray-700 block mb-1">Search Books</label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Search className="w-4 h-4" />
                  <span>Title, Author, ISBN...</span>
                </div>
              </div>
              <div className="border-2 border-[#C4A672] rounded-lg p-3 bg-[#C4A672]/5">
                <label className="text-xs text-gray-700 block mb-1">ISBN</label>
                <div className="text-sm text-gray-600">978-3-16...</div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-3">
                <label className="text-xs text-gray-700 block mb-1">Category</label>
                <div className="text-sm text-gray-600">All Categories ▼</div>
              </div>
            </div>
          </div>

          {/* Secondary Row */}
          <div className="mb-4">
            <h4 className="text-sm text-gray-600 mb-3">Secondary Filter Row:</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="border-2 border-gray-300 rounded-lg p-3">
                <label className="text-xs text-gray-700 block mb-1">Condition</label>
                <div className="text-sm text-gray-600">All Conditions ▼</div>
              </div>
              <div className="border-2 border-[#C4A672] rounded-lg p-3 bg-[#C4A672]/5">
                <label className="text-xs text-gray-700 block mb-1">Rental Period</label>
                <div className="text-sm text-[#C4A672] font-medium">Monthly ▼</div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-3">
                <label className="text-xs text-gray-700 block mb-1">Location</label>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>City/ZIP</span>
                </div>
              </div>
              <div className="border-2 border-gray-300 rounded-lg p-3 flex items-center justify-center">
                <span className="text-sm text-gray-600">Clear Filters</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="border-t-2 border-gray-200 pt-4">
            <h4 className="text-sm text-gray-600 mb-3">Advanced Filters (Expandable):</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <label className="text-sm text-gray-700 block mb-2">
                  Monthly Price Range: <span className="text-[#C4A672]">Rs. 0 - Rs. 20</span>
                </label>
                <div className="h-2 bg-gray-200 rounded-full relative">
                  <div className="absolute left-0 right-0 h-full bg-[#C4A672] rounded-full"></div>
                  <div className="absolute left-0 -top-1 w-4 h-4 bg-[#C4A672] rounded-full border-2 border-white"></div>
                  <div className="absolute right-0 -top-1 w-4 h-4 bg-[#C4A672] rounded-full border-2 border-white"></div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-sm text-blue-900 mb-2">Active Filters:</h5>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Search: mockingbird</Badge>
                  <Badge variant="secondary">Category: Classic</Badge>
                  <Badge variant="secondary">Period: monthly</Badge>
                  <Badge variant="secondary">Price: Rs. 3-Rs. 10</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Book Card Examples */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-[#C4A672]" />
            Book Card Display
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example Card 1 */}
            <div className="border-2 border-[#C4A672] rounded-xl overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-200 relative flex items-center justify-center">
                <span className="text-gray-500">Book Cover</span>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  2 photos
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-[#2C3E50] mb-1">To Kill a Mockingbird</h4>
                    <p className="text-sm text-gray-600">by Harper Lee</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">ISBN: 978-3-16-148410-0</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Rental Options</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekly:</span>
                      <span className="text-gray-800">Rs. 2.99/wk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="text-[#C4A672] font-medium">Rs. 5.99/mo ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yearly:</span>
                      <span className="text-gray-800">Rs. 49.99/yr</span>
                    </div>
                  </div>
                </div>
                <div className="text-center py-2 bg-[#C4A672] text-white rounded-lg text-sm">
                  View Details & Rent
                </div>
              </div>
            </div>

            {/* Example Card 2 */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-green-100 to-green-200 relative flex items-center justify-center">
                <span className="text-gray-500">Book Cover</span>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  1 photo
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-[#2C3E50] mb-1">1984</h4>
                    <p className="text-sm text-gray-600">by George Orwell</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">New</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">ISBN: 978-0-06-112008-4</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Rental Options</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekly:</span>
                      <span className="text-gray-800">Rs. 3.99/wk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="text-[#C4A672] font-medium">Rs. 7.99/mo ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yearly:</span>
                      <span className="text-gray-800">Rs. 59.99/yr</span>
                    </div>
                  </div>
                </div>
                <div className="text-center py-2 bg-[#C4A672] text-white rounded-lg text-sm">
                  View Details & Rent
                </div>
              </div>
            </div>

            {/* Example Card 3 */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-yellow-100 to-yellow-200 relative flex items-center justify-center">
                <span className="text-gray-500">Book Cover</span>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  2 photos
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-[#2C3E50] mb-1">The Great Gatsby</h4>
                    <p className="text-sm text-gray-600">by F. Scott Fitzgerald</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-2">ISBN: 978-0-7432-7356-5</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>Oakland, CA</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span>Rental Options</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weekly:</span>
                      <span className="text-gray-800">Rs. 1.99/wk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly:</span>
                      <span className="text-[#C4A672] font-medium">Rs. 3.99/mo ✓</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Yearly:</span>
                      <span className="text-gray-800">Rs. 29.99/yr</span>
                    </div>
                  </div>
                </div>
                <div className="text-center py-2 bg-[#C4A672] text-white rounded-lg text-sm">
                  View Details & Rent
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Summary */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl mb-4">All Features Implemented</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Book Details Search</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Rental Price Options</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Time Period Dropdown</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Location Proximity</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Condition Filter</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Photo Previews</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Real-time Filtering</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm">Responsive Design</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
