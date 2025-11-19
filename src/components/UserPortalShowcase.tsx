import { Button } from './ui/button';
import { 
  User, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Heart,
  Lock,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  ShoppingCart,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function UserPortalShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#2C3E50] text-4xl mb-4">User Portal - Complete Features</h1>
          <p className="text-gray-600 text-xl">All implemented and ready to use!</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl text-[#2C3E50] mb-1">Profile</h3>
            <p className="text-sm text-gray-600">Full management</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl text-[#2C3E50] mb-1">Purchases</h3>
            <p className="text-sm text-gray-600">Complete history</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl text-[#2C3E50] mb-1">Sales</h3>
            <p className="text-sm text-gray-600">Earnings tracker</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl text-[#2C3E50] mb-1">Rentals</h3>
            <p className="text-sm text-gray-600">Active & past</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl text-[#2C3E50] mb-1">Wishlist</h3>
            <p className="text-sm text-gray-600">Saved books</p>
          </div>
        </div>

        {/* Feature Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Profile Features */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
              <User className="w-7 h-7 text-[#C4A672]" />
              Profile Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[#2C3E50]">Personal Information</p>
                  <p className="text-sm text-gray-600">Edit name, email, phone number</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[#2C3E50]">Location Settings</p>
                  <p className="text-sm text-gray-600">Manage address (street, city, state, ZIP)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[#2C3E50]">Payment Methods</p>
                  <p className="text-sm text-gray-600">Add/remove cards, view masked numbers</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-900">Security Settings</p>
                  <p className="text-sm text-red-700">Change password, delete account</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History Features */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-blue-600" />
              Purchase History
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#2C3E50]">To Kill a Mockingbird</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Delivered</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">by Harper Lee</p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>Order #1</span>
                  <span>•</span>
                  <span>Nov 01, 2024</span>
                  <span>•</span>
                  <span className="text-[#C4A672]">$15.99</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Details
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Receipt
                  </Button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ✅ View all orders • Export to CSV • Track status
                </p>
              </div>
            </div>
          </div>

          {/* Sales History Features */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
              <DollarSign className="w-7 h-7 text-green-600" />
              Sales History
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-4">
              <p className="text-green-700 text-sm mb-1">Total Earnings</p>
              <p className="text-green-900 text-3xl">$245.50</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#2C3E50]">The Great Gatsby</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Completed</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Sold to: Jane Smith</span>
                <span>•</span>
                <span>Oct 15, 2024</span>
                <span>•</span>
                <span className="text-green-600">+$12.00</span>
              </div>
            </div>
          </div>

          {/* Rental History Features */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-purple-600" />
              Rental History
            </h2>
            
            {/* Active Rental */}
            <div className="mb-4">
              <h4 className="text-sm text-gray-600 mb-2">Active Rentals</h4>
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#2C3E50]">Pride and Prejudice</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">by Jane Austen</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Due: Nov 30, 2024 • 15 days left</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#C4A672] hover:bg-[#8B7355] text-white flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Return
                  </Button>
                </div>
              </div>
            </div>

            {/* Past Rental */}
            <div>
              <h4 className="text-sm text-gray-600 mb-2">Past Rentals</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#2C3E50]">The Catcher in the Rye</h4>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Returned</span>
                </div>
                <div className="text-sm text-gray-500">
                  Sep 1 - Oct 1, 2024 • $5.99
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Wishlist */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
              <Heart className="w-7 h-7 text-red-600 fill-red-600" />
              Wishlist & Favorites
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-[#2C3E50] mb-1">The Hobbit</h4>
                <p className="text-sm text-gray-600 mb-2">by J.R.R. Tolkien</p>
                <p className="text-[#C4A672] mb-3">$14.99</p>
                <Button size="sm" className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-[#2C3E50] mb-1">Dune</h4>
                <p className="text-sm text-gray-600 mb-2">by Frank Herbert</p>
                <p className="text-[#C4A672] mb-3">$16.50</p>
                <Button size="sm" className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
            <div className="mt-4 bg-pink-50 border border-pink-200 rounded-lg p-4">
              <p className="text-sm text-pink-900">
                ✅ Save favorites • Quick add to cart • Price tracking
              </p>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-[#2C3E50] text-2xl mb-6 flex items-center gap-3">
              <Lock className="w-7 h-7 text-orange-600" />
              Security Features
            </h2>
            
            {/* Change Password */}
            <div className="border border-orange-200 rounded-lg p-4 mb-4 bg-orange-50">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-orange-900 mb-2">Change Password</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Current password verification</li>
                    <li>• 8+ character requirement</li>
                    <li>• Password strength indicator</li>
                    <li>• Confirmation matching</li>
                  </ul>
                  <Button size="sm" variant="outline" className="mt-3 border-orange-300 text-orange-900 hover:bg-orange-100">
                    Open Change Password Modal
                  </Button>
                </div>
              </div>
            </div>

            {/* Delete Account */}
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-900 mb-2">Delete Account</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Type "DELETE" confirmation</li>
                    <li>• Acknowledgment checkbox</li>
                    <li>• Warning about data loss</li>
                    <li>• Permanent deletion</li>
                  </ul>
                  <Button size="sm" variant="outline" className="mt-3 border-red-300 text-red-900 hover:bg-red-100">
                    Open Delete Modal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl mb-4">Quick Links & Integration</h2>
          <p className="text-white/90 mb-6 text-lg">Seamlessly connected to all marketplace features</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2" />
              <h4 className="mb-1">Buy Books</h4>
              <p className="text-sm text-white/80">Navigate to marketplace</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <h4 className="mb-1">Rent Books</h4>
              <p className="text-sm text-white/80">Open rental flow</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <DollarSign className="w-8 h-8 mx-auto mb-2" />
              <h4 className="mb-1">Sell Books</h4>
              <p className="text-sm text-white/80">List books for sale</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-6 py-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-900">All Features Implemented & Production Ready</span>
          </div>
          <p className="text-gray-600 text-lg">
            Complete user portal with profile management, transaction history, wishlist, and secure account controls
          </p>
        </div>
      </div>
    </div>
  );
}
