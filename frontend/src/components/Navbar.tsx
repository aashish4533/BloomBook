import { useState, useRef, useEffect } from 'react';
import { Home, ShoppingBag, Calendar, DollarSign, User, LogIn, UserPlus, LogOut, ChevronDown, UserCircle2, History, Heart, Settings, Users, Search } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell';
import { CartDrawer } from './Cart/CartDrawer';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export function Navbar({
  isLoggedIn,
  onLogout,
}: NavbarProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const currentPage = location.pathname;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'buy', label: 'Buy', icon: ShoppingBag, path: '/marketplace' },
    { id: 'rent', label: 'Rent', icon: Calendar, path: '/rent' },
    { id: 'sell', label: 'Sell', icon: DollarSign, path: '/sell' },
    { id: 'communities', label: 'Communities', icon: Users, path: '/communities' },
  ];

  // Mobile navigation items
  const mobileNavItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/', showAlways: true },
    { id: 'search', label: 'Search', icon: Search, path: '/search', showAlways: true },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, path: '/wishlist', showAlways: false, requireLogin: true },
    { id: 'sell', label: 'Sell', icon: DollarSign, path: '/sell', showAlways: true },
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard', showAlways: true },
  ];

  const isActive = (path: string) => {
    if (path === '/' && currentPage !== '/') return false;
    return currentPage.startsWith(path);
  };

  return (
    <>
      {/* Desktop Navbar - Fixed Top */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-[#C4A672] shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2C3E50] rounded-lg flex items-center justify-center">
                <span className="text-white">BO</span>
              </div>
              <span className="text-[#2C3E50] text-xl">BookBloom</span>
            </Link>

            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${active
                      ? 'bg-[#2C3E50] text-white'
                      : 'text-[#2C3E50] hover:bg-[#8B7355] hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  {/* Cart Drawer */}
                  <CartDrawer />

                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2C3E50] text-white hover:bg-[#1a252f] transition-colors"
                    >
                      <div className="w-8 h-8 bg-[#C4A672] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <span className="hidden lg:inline">Profile</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="text-[#2C3E50]">user@example.com</p>
                        </div>

                        {/* Quick Links */}
                        <div className="py-2">
                          <Link
                            to="/dashboard"
                            onClick={() => setShowProfileDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <UserCircle2 className="w-5 h-5" />
                            <div className="text-left">
                              <p className="text-sm">My Profile</p>
                              <p className="text-xs text-gray-500">View & edit details</p>
                            </div>
                          </Link>

                          <Link
                            to="/dashboard/orders"
                            onClick={() => setShowProfileDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <History className="w-5 h-5" />
                            <div className="text-left">
                              <p className="text-sm">Order History</p>
                              <p className="text-xs text-gray-500">Purchases & rentals</p>
                            </div>
                          </Link>

                          <Link
                            to="/wishlist"
                            onClick={() => setShowProfileDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Heart className="w-5 h-5" />
                            <div className="text-left">
                              <p className="text-sm">Wishlist</p>
                              <p className="text-xs text-gray-500">Saved favorites</p>
                            </div>
                          </Link>

                          <Link
                            to="/dashboard/settings"
                            onClick={() => setShowProfileDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <Settings className="w-5 h-5" />
                            <div className="text-left">
                              <p className="text-sm">Settings</p>
                              <p className="text-xs text-gray-500">Security & preferences</p>
                            </div>
                          </Link>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200 pt-2">
                          <button
                            onClick={() => {
                              onLogout();
                              setShowProfileDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <Link to="/login">
                    <Button
                      variant="outline"
                      className="border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>

                  {/* Register Button */}
                  <Link to="/register">
                    <Button
                      className="bg-[#2C3E50] text-white hover:bg-[#1a252f]"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tab Bar - Fixed Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#C4A672] border-t border-[#8B7355] shadow-lg z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const shouldShow = item.showAlways || (item.requireLogin && isLoggedIn);
            return (
              shouldShow && (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${active
                    ? 'text-[#2C3E50]'
                    : 'text-[#2C3E50]/60'
                    }`}
                >
                  <Icon className={`w-6 h-6 ${active ? 'fill-[#2C3E50]' : ''}`} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              )
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="hidden md:block h-16" />
      {/* Spacer for mobile tab bar */}
      <div className="md:hidden h-16" />
    </>
  );
}