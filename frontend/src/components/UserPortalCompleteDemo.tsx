import { Badge } from './ui/badge';
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
  AlertCircle,
  BookOpen,
  MapPin,
  CreditCard,
  X
} from 'lucide-react';

export function UserPortalCompleteDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-6 py-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-900">ALL FEATURES IMPLEMENTED & COMPLETE</span>
          </div>
          <h1 className="text-[#2C3E50] text-4xl mb-4">
            User Portal - Complete Implementation
          </h1>
          <p className="text-gray-600 text-xl">
            History Tabs • Quick Links • Security Features
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          {/* Mock Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#C4A672] rounded-lg flex items-center justify-center text-white">
                  <span>BO</span>
                </div>
                <h1 className="text-[#2C3E50] text-2xl">BookBloom</h1>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Books
                </Button>
                <Button variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Welcome Banner with Quick Links */}
          <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] p-8 text-white">
            <h2 className="text-3xl mb-2">Welcome back, User!</h2>
            <p className="text-white/90 mb-6">Manage your books, view history, and explore new titles</p>
            <div className="flex gap-3">
              <Button className="bg-white text-[#C4A672] hover:bg-white/90">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Buy Books
              </Button>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Calendar className="w-4 h-4 mr-2" />
                Rent Books
              </Button>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <DollarSign className="w-4 h-4 mr-2" />
                Sell Books
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex gap-2 p-2">
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#C4A672] text-white">
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100">
                <ShoppingBag className="w-5 h-5" />
                <span>Purchases</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100">
                <DollarSign className="w-5 h-5" />
                <span>Sales</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100">
                <Calendar className="w-5 h-5" />
                <span>Rentals</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100">
                <Heart className="w-5 h-5" />
                <span>Wishlist</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Tab 1: Past Purchases */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-[#2C3E50] text-2xl">Past Purchases</h2>
                <p className="text-sm text-gray-600">Complete purchase history</p>
              </div>
            </div>

            {/* Sample Purchase Card */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#2C3E50]">To Kill a Mockingbird</h4>
                <Badge className="bg-green-100 text-green-800">Delivered</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">by Harper Lee</p>
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <span>Order #1</span>
                <span>•</span>
                <span>Nov 01, 2024</span>
                <span>•</span>
                <span className="text-[#C4A672]">$15.99</span>
              </div>
              <div className="flex gap-2">
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
              <h4 className="text-sm text-blue-900 mb-2">Features:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Complete list of all bought books</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Order ID, date, price, status badges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Export to CSV functionality</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab 2: Past Sales */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-[#2C3E50] text-2xl">Past Sales</h2>
                <p className="text-sm text-gray-600">Track your earnings</p>
              </div>
            </div>

            {/* Earnings Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-4">
              <p className="text-green-700 text-sm mb-1">Total Earnings</p>
              <p className="text-green-900 text-3xl">$245.50</p>
            </div>

            {/* Sample Sale Card */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[#2C3E50]">The Great Gatsby</h4>
                <Badge className="bg-green-100 text-green-800">Completed</Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>Sold to: Jane Smith</span>
                <span>•</span>
                <span>Oct 15, 2024</span>
                <span>•</span>
                <span className="text-green-600">+$12.00</span>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm text-green-900 mb-2">Features:</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Total earnings tracker (large display)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>List of sold books with buyer info</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Transaction details and status</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab 3: Rental History */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-[#2C3E50] text-2xl">Rental History</h2>
                <p className="text-sm text-gray-600">Active & past rentals</p>
              </div>
            </div>

            {/* Active Rental */}
            <div className="mb-4">
              <h4 className="text-sm text-gray-600 mb-2">Active Rentals</h4>
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#2C3E50]">Pride and Prejudice</h4>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
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
            <div className="mb-4">
              <h4 className="text-sm text-gray-600 mb-2">Past Rentals</h4>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#2C3E50]">The Catcher in the Rye</h4>
                  <Badge className="bg-gray-100 text-gray-800">Returned</Badge>
                </div>
                <p className="text-sm text-gray-500">Sep 1 - Oct 1, 2024 • $5.99</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm text-purple-900 mb-2">Features:</h4>
              <ul className="space-y-1 text-sm text-purple-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Active rentals with due dates & days left</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Renewal options (one-click extend)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Return book functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Complete past rental history</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab 4: Wishlist */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-[#2C3E50] text-2xl">Wishlist</h2>
                <p className="text-sm text-gray-600">Your favorite books</p>
              </div>
            </div>

            {/* Wishlist Items */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[#2C3E50] text-sm">The Hobbit</h4>
                  <button className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">by J.R.R. Tolkien</p>
                <p className="text-[#C4A672] mb-3">$14.99</p>
                <Button size="sm" className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white text-xs">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Add to Cart
                </Button>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[#2C3E50] text-sm">Dune</h4>
                  <button className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">by Frank Herbert</p>
                <p className="text-[#C4A672] mb-3">$16.50</p>
                <Button size="sm" className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white text-xs">
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h4 className="text-sm text-pink-900 mb-2">Features:</h4>
              <ul className="space-y-1 text-sm text-pink-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Save favorite books</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Quick add to cart button</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Remove from wishlist (X button)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Price and availability display</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-[#2C3E50] text-3xl mb-8 text-center">
            Secure Elements - Password & Account Management
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Change Password Modal */}
            <div className="border-2 border-orange-200 rounded-xl p-6 bg-orange-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-orange-900 text-xl">Change Password</h3>
                  <p className="text-sm text-orange-700">Secure password update</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-orange-800 block mb-1">Current Password</label>
                  <div className="bg-white border border-orange-300 rounded px-3 py-2 text-sm text-gray-500">
                    ••••••••
                  </div>
                </div>
                <div>
                  <label className="text-xs text-orange-800 block mb-1">New Password</label>
                  <div className="bg-white border border-orange-300 rounded px-3 py-2 text-sm text-gray-500">
                    ••••••••
                  </div>
                </div>
                <div>
                  <label className="text-xs text-orange-800 block mb-1">Confirm New Password</label>
                  <div className="bg-white border border-orange-300 rounded px-3 py-2 text-sm text-gray-500">
                    ••••••••
                  </div>
                </div>
              </div>

              <div className="bg-white border border-orange-300 rounded-lg p-4 mb-4">
                <h4 className="text-sm text-orange-900 mb-2">Security Features:</h4>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Current password verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>8+ character requirement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Password confirmation matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Real-time validation errors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Success confirmation</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-orange-300 text-orange-900">
                  Cancel
                </Button>
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                  Update Password
                </Button>
              </div>
            </div>

            {/* Delete Account Modal */}
            <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-red-900 text-xl">Delete Account</h3>
                  <p className="text-sm text-red-700">Permanent action</p>
                </div>
              </div>

              <div className="bg-white border-2 border-red-300 rounded-lg p-4 mb-4">
                <h4 className="text-red-900 mb-2">⚠️ Warning</h4>
                <p className="text-sm text-red-800 mb-2">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                  <li>All your book listings</li>
                  <li>Purchase and rental history</li>
                  <li>Saved payment methods</li>
                  <li>Wishlist and favorites</li>
                </ul>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-red-800 block mb-1">Type "DELETE" to confirm</label>
                  <div className="bg-white border border-red-300 rounded px-3 py-2 text-sm text-gray-500">
                    DELETE
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 rounded mt-0.5 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-red-600" />
                  </div>
                  <label className="text-sm text-red-800">
                    I understand that this action is permanent and cannot be reversed
                  </label>
                </div>
              </div>

              <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
                <h4 className="text-sm text-red-900 mb-2">Safety Features:</h4>
                <ul className="space-y-1 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Type "DELETE" confirmation required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Acknowledgment checkbox required</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Clear data loss warnings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Both conditions must be met</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Confirmation email sent</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 border-red-300 text-red-900">
                  Cancel
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Features */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-2xl p-8 text-white">
          <h2 className="text-3xl mb-6 text-center">Quick Links - Integration Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xl mb-2 text-center">Buy Books</h3>
              <p className="text-white/80 text-center text-sm mb-4">
                Navigate directly to marketplace to browse and purchase books
              </p>
              <div className="text-center py-2 bg-white/20 rounded-lg text-sm">
                Quick Link Button
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl mb-2 text-center">Rent Books</h3>
              <p className="text-white/80 text-center text-sm mb-4">
                Access complete rental flow with search, filters, and checkout
              </p>
              <div className="text-center py-2 bg-white/20 rounded-lg text-sm">
                Quick Link Button
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-7 h-7" />
              </div>
              <h3 className="text-xl mb-2 text-center">Sell Books</h3>
              <p className="text-white/80 text-center text-sm mb-4">
                List your books for sale with easy-to-use selling flow
              </p>
              <div className="text-center py-2 bg-white/20 rounded-lg text-sm">
                Quick Link Button
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl mb-4 text-center">Integration Points</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Seamless navigation to marketplace from dashboard</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Direct access to rental system with all filters</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Quick sell flow entry from user portal</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Wishlist items can be added to cart instantly</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Browse Books button in header for easy return</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Logout with confirmation modal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Final Summary */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-8 py-4 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="text-green-900 text-lg">All Features 100% Complete & Production Ready</span>
          </div>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            Complete user portal with history tabs (Purchases, Sales, Rentals, Wishlist),
            quick links for seamless integration, and secure password change & account deletion with confirmation modals.
          </p>
        </div>
      </div>
    </div>
  );
}
