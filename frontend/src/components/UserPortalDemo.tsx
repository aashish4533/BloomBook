import { Button } from './ui/button';
import { User, ShoppingBag, DollarSign, Calendar, Heart, Settings, CreditCard, MapPin } from 'lucide-react';

interface UserPortalDemoProps {
  onAccessUserDashboard: () => void;
}

export function UserPortalDemo({ onAccessUserDashboard }: UserPortalDemoProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-[#2C3E50] text-4xl mb-4">BookOra User Portal</h1>
          <p className="text-gray-600 text-lg">Your personalized dashboard to manage everything</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] text-xl">Profile Management</h3>
                <p className="text-gray-600 text-sm">Edit your personal details</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#C4A672]" />
                Update name, email, phone
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C4A672]" />
                Manage location and address
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C4A672]" />
                Payment methods
              </li>
              <li className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C4A672]" />
                Security settings
              </li>
            </ul>
          </div>

          {/* Purchase History Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] text-xl">Purchase History</h3>
                <p className="text-gray-600 text-sm">Track your book purchases</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                View all bought books
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Order details and status
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Download receipts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Reorder favorite books
              </li>
            </ul>
          </div>

          {/* Sales History Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] text-xl">Sales History</h3>
                <p className="text-gray-600 text-sm">Monitor your book sales</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                View sold books
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Track earnings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Transaction details
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Sales analytics
              </li>
            </ul>
          </div>

          {/* Rental History Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] text-xl">Rental History</h3>
                <p className="text-gray-600 text-sm">Manage your rentals</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Active rentals with due dates
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Renewal options
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Past rental history
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Return confirmation
              </li>
            </ul>
          </div>

          {/* Wishlist Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] text-xl">Wishlist & Favorites</h3>
                <p className="text-gray-600 text-sm">Save books you want to read</p>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Save favorite books
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Quick add to cart
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Price tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#C4A672] rounded-full" />
                Availability notifications
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Button
            onClick={onAccessUserDashboard}
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-12 py-6 text-lg h-auto"
          >
            Access Your Dashboard
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            All your book management features in one place
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-blue-900 mb-2 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Security Features Available
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Change password securely
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Two-factor authentication
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Email verification
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              Account deletion option
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
