import { useState, useRef, useEffect } from 'react';
import { Home, ShoppingBag, Calendar, DollarSign, User, LogIn, UserPlus, LogOut, ChevronDown, UserCircle2, History, Heart, Settings, Users, Search, ArrowLeftRight, Menu, Info, Phone, FileText, HelpCircle, Shield, ChevronRight, GraduationCap, Bot, X, PanelLeft } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationBell } from './NotificationBell';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
  /** Opens the main app sidebar (drawer) on small screens */
  onOpenAppMenu?: () => void;
}

export function Navbar({
  isLoggedIn,
  onLogout,
  onOpenAppMenu,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const currentPage = location.pathname;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'tuition', label: 'Tuition', icon: GraduationCap, path: '/tuition' },
    { id: 'notes', label: 'Material', icon: FileText, path: '/notes' },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, path: '/assistant' },
    { id: 'buy', label: 'Buy', icon: ShoppingBag, path: '/marketplace' },
    { id: 'rent', label: 'Rent', icon: Calendar, path: '/rent' },
    { id: 'exchange', label: 'Exchange', icon: ArrowLeftRight, path: '/exchange' },
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
      <nav className="sticky top-0 w-full bg-[#C4A672] shadow-lg z-50 relative pt-[env(safe-area-inset-top)]" ref={menuRef}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="relative flex items-center justify-between gap-2 py-3 sm:py-4 w-full min-w-0 min-h-[52px]">
            {/* LEFT: App sidebar + Hamburger + Logo */}
            <div className="flex flex-1 min-w-0 items-center gap-1 sm:gap-3 z-10">
              {onOpenAppMenu && (
                <button
                  type="button"
                  onClick={onOpenAppMenu}
                  className="md:hidden p-2 rounded-md hover:bg-[#8B7355]/80 focus:outline-none transition-colors shrink-0"
                  aria-label="Open navigation sidebar"
                >
                  <PanelLeft className="w-6 h-6 text-[#2C3E50]" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md hover:bg-[#8B7355] focus:outline-none transition-colors shrink-0"
                aria-label={isMenuOpen ? "Close menu" : "Open site menu"}
              >
                {isMenuOpen ? <X className="w-6 h-6 text-[#2C3E50]" /> : <Menu className="w-6 h-6 text-[#2C3E50]" />}
              </button>

              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 group min-w-0">
                <img
                  src="/brand/navbar-golden.png"
                  alt="BookBloom"
                  className="h-9 sm:h-10 w-auto max-w-[min(220px,42vw)] object-contain object-left shrink-0"
                  width={220}
                  height={40}
                />
              </Link>
            </div>

            {/* CENTER: Desktop nav icons — absolutely centered in the bar */}
            <div className="hidden lg:pointer-events-none lg:absolute lg:left-1/2 lg:top-1/2 lg:z-[5] lg:flex lg:-translate-x-1/2 lg:-translate-y-1/2 lg:items-center">
              <div className="pointer-events-auto flex items-center gap-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      title={item.label}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${active
                        ? 'bg-[#2C3E50] text-white shadow-sm'
                        : 'text-[#2C3E50] hover:bg-[#8B7355] hover:text-white'
                        }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${active ? 'stroke-[2.5px]' : ''}`} />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Notifications, assistant shortcut, profile / auth */}
            <div className="flex flex-1 min-w-0 items-center justify-end gap-1 sm:gap-2 md:gap-3 z-10">
                {isLoggedIn ? (
                  <>
                    <NotificationBell />

                    <Link
                      to="/assistant"
                      className={`relative p-1.5 sm:p-2 rounded-lg transition-colors shrink-0 ${isActive('/assistant')
                          ? 'bg-[#C4A672]/20 text-[#2C3E50]'
                          : 'text-[#2C3E50] hover:bg-[#8B7355] hover:text-white'
                        }`}
                      title="AI Assistant"
                    >
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Link>

                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-[#2C3E50] text-white hover:bg-[#1a252f] transition-colors max-w-[10rem] sm:max-w-none"
                      >
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#C4A672] rounded-full flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <span className="hidden lg:inline truncate">Profile</span>
                        <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${showProfileDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showProfileDropdown && (
                        <div className="absolute right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm text-gray-500">Signed in as</p>
                            <p className="text-[#2C3E50] truncate">{auth.currentUser?.email}</p>
                          </div>

                          <div className="py-2">
                            <Link to="/dashboard" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                              <UserCircle2 className="w-5 h-5" />
                              <div className="text-left">
                                <p className="text-sm">My Profile</p>
                                <p className="text-xs text-gray-500">View & edit details</p>
                              </div>
                            </Link>

                            <Link to="/dashboard/purchases" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                              <History className="w-5 h-5" />
                              <div className="text-left">
                                <p className="text-sm">Order History</p>
                                <p className="text-xs text-gray-500">Purchases & rentals</p>
                              </div>
                            </Link>

                            <Link to="/wishlist" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                              <Heart className="w-5 h-5" />
                              <div className="text-left">
                                <p className="text-sm">Wishlist</p>
                                <p className="text-xs text-gray-500">Saved favorites</p>
                              </div>
                            </Link>

                            <Link to="/dashboard" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                              <Settings className="w-5 h-5" />
                              <div className="text-left">
                                <p className="text-sm">Settings</p>
                                <p className="text-xs text-gray-500">Security & preferences</p>
                              </div>
                            </Link>
                          </div>

                          <div className="border-t border-gray-200 pt-2">
                            <button
                              onClick={() => {
                                onLogout();
                                setShowProfileDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-white bg-red-600 hover:bg-red-700 transition-colors"
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
                    <Link to="/login">
                      <Button
                        variant="outline"
                        className="border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white hidden sm:flex"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white sm:hidden"
                      >
                        <LogIn className="w-4 h-4" />
                      </Button>
                    </Link>

                    <Link to="/register">
                      <Button
                        className="bg-[#2C3E50] text-white hover:bg-[#1a252f] hidden sm:flex"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register
                      </Button>
                      <Button
                        size="icon"
                        className="bg-[#2C3E50] text-white hover:bg-[#1a252f] sm:hidden"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

        {/* Mobile Collapsible Menu */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full w-full max-h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] bg-white dark:bg-gray-900 z-[9999] shadow-2xl flex flex-col p-3 sm:p-4 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${active
                      ? 'bg-[#2C3E50] text-white'
                      : 'text-[#2C3E50] hover:bg-[#C4A672]/10 hover:text-[#C4A672]'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-base">{item.label}</span>
                </Link>
              );
            })}

            {/* Auth shortcuts in menu for mobile */}
            {!isLoggedIn && (
              <div className="pb-2 pt-2 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex-1 w-full">
                  <Button variant="outline" className="w-full border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white">
                    <LogIn className="w-4 h-4 mr-2" /> Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex-1 w-full">
                  <Button className="w-full bg-[#2C3E50] text-white hover:bg-[#1a252f]">
                    <UserPlus className="w-4 h-4 mr-2" /> Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}