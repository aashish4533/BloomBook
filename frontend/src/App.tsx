import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { CartProvider } from './context/CartContext';

// Layouts
import { MainLayout } from './components/Layouts/MainLayout';
import { AuthLayout } from './components/Layouts/AuthLayout';

// Routes
import { ProtectedRoute } from './components/Routes/ProtectedRoute';
import { AdminRoute } from './components/Routes/AdminRoute';

// Components
import { HomeScreen } from './components/HomeScreen';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { BookMarketplace } from './components/BookMarketplace';
import { BookDetailsPage } from './components/BookDetailsPage';
import { RentBookFlow } from './components/RentBookFlow';
import { SellBookFlow } from './components/SellBookFlow';
import { ExchangeBookFlow } from './components/ExchangeBookFlow';
import { CommunitiesBrowse } from './components/Communities/CommunitiesBrowse';
import { CreateCommunity } from './components/Communities/CreateCommunity';
import { CommunityDetails } from './components/Communities/CommunityDetails';
import { GroupChat } from './components/Communities/GroupChat';
import { PrivateChat } from './components/Chat/PrivateChat';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import { AboutPage } from './components/AboutPage';
import { AdvancedSearch } from './components/AdvancedSearch';
import { WishlistPage } from './components/WishlistPage';
import { TuitionHub } from './components/TuitionHub';
import { NotesHub } from './components/NotesHub';
import { DeliveryTracking } from './components/DeliveryTracking';

// User Dashboard Sub-components
import { UserProfile } from './components/User/UserProfile';
import { PurchaseHistory } from './components/User/PurchaseHistory';
import { SalesHistory } from './components/User/SalesHistory';
import { RentalHistory } from './components/User/RentalHistory';
import { Wishlist } from './components/User/Wishlist';
import { UserCommunities } from './components/User/UserCommunities';
import { UserChats } from './components/User/UserChats';
import { UserExchanges } from './components/User/UserExchanges';

// Admin Dashboard Sub-components
import { UserManagement } from './components/Admin/UserManagement';
import { BookInventory } from './components/Admin/BookInventory';
import { RentalManagement } from './components/Admin/RentalManagement';
import { TransactionHistory } from './components/Admin/TransactionHistory';
import { CommunityManagement } from './components/Admin/CommunityManagement';
import { SystemSettings } from './components/Admin/SystemSettings';
import { Button } from './components/ui/button'; // For Admin Announcements placeholder

// Wrappers for components that need navigation or location state
function SellBookFlowWrapper() {
  const navigate = useNavigate();
  return <SellBookFlow onClose={() => navigate('/')} />;
}

function RentBookFlowWrapper() {
  const navigate = useNavigate();
  return <RentBookFlow onClose={() => navigate('/')} />;
}

function ExchangeBookFlowWrapper() {
  const navigate = useNavigate();
  return <ExchangeBookFlow onClose={() => navigate('/')} />;
}

function PrivateChatWrapper() {
  const location = useLocation();
  const { otherUser, bookContext } = location.state || {};

  if (!otherUser) {
    return <Navigate to="/dashboard/chats" replace />;
  }

  return <PrivateChat otherUser={otherUser} bookContext={bookContext} />;
}

function AdminAnnouncementsWrapper() {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <h3 className="text-xl text-gray-700 mb-2">Announcements Management</h3>
      <p className="text-gray-500 mb-4">Manage announcements from the main Announcements page</p>
      <Button onClick={() => navigate('/announcements')} className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
        Go to Announcements
      </Button>
    </div>
  );
}

export default function App() {
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!userRole) setUserRole('user');
        setCurrentUser(user);
      } else {
        setUserRole(null);
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userRole]);

  const handleLogout = () => {
    auth.signOut();
    setUserRole(null);
    setCurrentUser(null);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginForm onLogin={() => setUserRole('user')} />} />
            <Route path="/register" element={<SignUpForm onSignUp={() => setUserRole('user')} />} />
            <Route path="/admin/login" element={<AdminLogin onLogin={() => setUserRole('admin')} />} />
          </Route>

          {/* Main App Routes */}
          <Route element={<MainLayout isLoggedIn={!!currentUser} onLogout={handleLogout} />}>
            <Route path="/" element={<HomeScreen isLoggedIn={!!currentUser} />} />
            <Route path="/marketplace" element={<BookMarketplace />} />
            <Route path="/book/:id" element={<BookDetailsPage />} />
            <Route path="/sell" element={<SellBookFlowWrapper />} />
            <Route path="/rent" element={<RentBookFlowWrapper />} />
            <Route path="/exchange" element={<ExchangeBookFlowWrapper />} />

            <Route path="/communities" element={<CommunitiesBrowse isLoggedIn={!!currentUser} />} />
            <Route path="/communities/create" element={<CreateCommunity userId={currentUser?.uid} userName={currentUser?.displayName} />} />
            <Route path="/communities/:id" element={<CommunityDetails userId={currentUser?.uid} />} />
            <Route path="/communities/:id/chat" element={<GroupChat currentUserId={currentUser?.uid} />} />

            <Route path="/chat" element={<PrivateChatWrapper />} />

            <Route path="/announcements" element={<AnnouncementsPage isAdmin={userRole === 'admin'} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<AdvancedSearch />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/tuition" element={<TuitionHub isLoggedIn={!!currentUser} />} />
            <Route path="/notes" element={<NotesHub />} />
            <Route path="/tracking/:orderId" element={<DeliveryTracking />} />

            {/* Protected User Routes */}
            <Route element={<ProtectedRoute isLoggedIn={!!currentUser} />}>
              <Route path="/dashboard" element={<UserDashboard onLogout={handleLogout} />}>
                <Route index element={<UserProfile />} />
                <Route path="purchases" element={<PurchaseHistory />} />
                <Route path="sales" element={<SalesHistory />} />
                <Route path="rentals" element={<RentalHistory />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="communities" element={<UserCommunities />} />
                <Route path="chats" element={<UserChats />} />
                <Route path="exchanges" element={<UserExchanges />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminRoute userRole={userRole} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard onLogout={handleLogout} />}>
                <Route index element={<UserManagement />} />
                <Route path="books" element={<BookInventory />} />
                <Route path="rentals" element={<RentalManagement />} />
                <Route path="transactions" element={<TransactionHistory />} />
                <Route path="communities" element={<CommunityManagement />} />
                <Route path="announcements" element={<AdminAnnouncementsWrapper />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}