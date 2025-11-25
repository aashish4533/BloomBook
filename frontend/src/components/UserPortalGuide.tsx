import { Button } from './ui/button';
import { 
  User, 
  Mail, 
  MapPin, 
  CreditCard, 
  Lock, 
  Shield, 
  Edit, 
  Download,
  Heart,
  ShoppingBag,
  DollarSign,
  Calendar,
  CheckCircle
} from 'lucide-react';

interface UserPortalGuideProps {
  onClose: () => void;
}

export function UserPortalGuide({ onClose }: UserPortalGuideProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[#2C3E50] text-4xl mb-4">User Portal Guide</h1>
          <p className="text-gray-600 text-xl">Everything you can do in your personalized dashboard</p>
        </div>

        {/* Profile Management Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 bg-[#C4A672] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-[#2C3E50] text-2xl">Profile Management</h2>
              <p className="text-gray-600">Complete control over your account settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-[#C4A672]" />
                <h3 className="text-[#2C3E50] text-xl">Personal Information</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Edit your profile</p>
                    <p className="text-sm">Update name, email, and phone number</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Profile photo</p>
                    <p className="text-sm">Personalize with your avatar</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Contact preferences</p>
                    <p className="text-sm">Choose how we reach you</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Location Settings */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-6 h-6 text-[#C4A672]" />
                <h3 className="text-[#2C3E50] text-xl">Location Settings</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Shipping address</p>
                    <p className="text-sm">Street, city, state, and ZIP code</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Multiple addresses</p>
                    <p className="text-sm">Save work and home locations</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Pickup preferences</p>
                    <p className="text-sm">Set your default location</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-[#C4A672]" />
                <h3 className="text-[#2C3E50] text-xl">Payment Methods</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Manage cards</p>
                    <p className="text-sm">Add, remove, or update credit/debit cards</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E30]">Secure storage</p>
                    <p className="text-sm">Encrypted payment information</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Default method</p>
                    <p className="text-sm">Set preferred payment option</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Security Settings */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-[#C4A672]" />
                <h3 className="text-[#2C3E50] text-xl">Security Settings</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Change password</p>
                    <p className="text-sm">Update your password anytime</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Two-factor auth</p>
                    <p className="text-sm">Extra security layer</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[#2C3E50]">Delete account</p>
                    <p className="text-sm">Permanent account removal option</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* History & Activity Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-[#2C3E50] text-2xl">History & Activity</h2>
              <p className="text-gray-600">Track all your transactions and activities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Purchase History */}
            <div className="border border-gray-200 rounded-lg p-6">
              <ShoppingBag className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-[#2C3E50] text-xl mb-3">Purchase History</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  View all bought books
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Order status tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Download receipts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Export history
                </li>
              </ul>
            </div>

            {/* Sales History */}
            <div className="border border-gray-200 rounded-lg p-6">
              <DollarSign className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-[#2C3E50] text-xl mb-3">Sales History</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Books you've sold
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Total earnings tracker
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Transaction details
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Buyer information
                </li>
              </ul>
            </div>

            {/* Rental History */}
            <div className="border border-gray-200 rounded-lg p-6">
              <Calendar className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-[#2C3E50] text-xl mb-3">Rental History</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Active rentals
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Due date reminders
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Renewal options
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                  Past rentals log
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Wishlist Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-[#2C3E50] text-2xl">Wishlist & Favorites</h2>
                <p className="text-gray-600">Save and organize books you love</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Add favorites</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ShoppingBag className="w-8 h-8 text-[#C4A672] mx-auto mb-2" />
              <p className="text-sm text-gray-600">Quick buy</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Price alerts</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Edit className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Manage lists</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl mb-4">Ready to get started?</h2>
          <p className="text-white/90 mb-6 text-lg">Access your personalized dashboard now</p>
          <Button
            onClick={onClose}
            className="bg-white text-[#C4A672] hover:bg-white/90 px-8 py-6 text-lg h-auto"
          >
            Go to My Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
