import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ChangePasswordSuccess } from './ChangePasswordSuccess';
import { Button } from './ui/button';
import { User, ShoppingBag, DollarSign, Calendar, Heart, BookOpen, LogOut, Users, MessageCircle, ArrowLeftRight, Gavel } from 'lucide-react';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface UserDashboardProps {
  onLogout: () => void;
}

export function UserDashboard({ onLogout }: UserDashboardProps) {
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const navigate = useNavigate();
  const [user, loading, error] = useAuthState(auth);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard' },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag, path: '/dashboard/purchases' },
    { id: 'sales', label: 'Sales', icon: DollarSign, path: '/dashboard/sales' },
    { id: 'rentals', label: 'Rentals', icon: Calendar, path: '/dashboard/rentals' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/dashboard/wishlist' },
    { id: 'communities', label: 'Communities', icon: Users, path: '/dashboard/communities' },
    { id: 'chats', label: 'Chats', icon: MessageCircle, path: '/dashboard/chats' },
    { id: 'exchanges', label: 'Exchanges', icon: ArrowLeftRight, path: '/dashboard/exchanges' },
    { id: 'negotiations', label: 'Negotiations', icon: Gavel, path: '/dashboard/negotiations' },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#C4A672] rounded-lg flex items-center justify-center text-white">
              <span>BB</span>
            </div>
            <h1 className="text-[#2C3E50] text-2xl">Book Bloom</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/marketplace">
              <Button variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Books
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl mb-2">Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!</h2>
          <p className="text-white/90 mb-6">Manage your books, view history, and explore new titles</p>
          <div className="flex gap-3">
            <Link to="/marketplace">
              <Button className="bg-white text-[#C4A672] hover:bg-white/90">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Buy Books
              </Button>
            </Link>
            <Link to="/rent">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Calendar className="w-4 h-4 mr-2" />
                Rent Books
              </Button>
            </Link>
            <Link to="/sell">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <DollarSign className="w-4 h-4 mr-2" />
                Sell Books
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.id}
                    to={tab.path}
                    end={tab.path === '/dashboard'}
                    className={({ isActive }) => `flex items-center gap-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive
                      ? 'bg-[#C4A672] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <Outlet context={{ onPasswordChangeSuccess: () => setShowPasswordSuccess(true) }} />
        </div>
      </div>

      {/* Password Change Success Modal */}
      {showPasswordSuccess && (
        <ChangePasswordSuccess onContinue={() => setShowPasswordSuccess(false)} />
      )}
    </div>
  );
}
