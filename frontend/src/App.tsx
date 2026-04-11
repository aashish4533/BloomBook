import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CartProvider } from './context/CartContext';
import { UserRoleProvider, useUserRole } from './context/UserRoleContext';

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
import { RentalHandoverPage } from './components/Rental/RentalHandoverPage';
import { SellBookFlow } from './components/SellBookFlow';
import { ExchangeBookFlow } from './components/ExchangeBookFlow';
import { CommunitiesBrowse } from './components/Communities/CommunitiesBrowse';
import { CreateCommunity } from './components/Communities/CreateCommunity';
import { CommunityDetails } from './components/Communities/CommunityDetails';
import { GroupChat } from './components/Communities/GroupChat';
import { PrivateChat } from './components/Chat/PrivateChat';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { HelpPage } from './components/HelpPage';
import { TermsPage } from './components/TermsPage';
import { AdvancedSearch } from './components/AdvancedSearch';
import { WishlistPage } from './components/WishlistPage';
import { TuitionHub } from './components/TuitionHub';
import { NotesHub } from './components/NotesHub';
import { TutorVerificationForm } from './components/TutorVerificationForm';
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
import { NegotiationInbox } from './components/User/NegotiationInbox';
import { UserReservations } from './components/User/UserReservations';

// AI Integration
import { AIChatbox } from './components/Chat/AIChatbox';
import { AIAssistantPage } from './components/AIAssistantPage';


// Admin Dashboard Sub-components
import { UserManagement } from './components/Admin/UserManagement';
import { BookInventory } from './components/Admin/BookInventory';
import { RentalManagement } from './components/Admin/RentalManagement';
import TransactionHistory from './components/Admin/TransactionHistory';
import { CommunityManagement } from './components/Admin/CommunityManagement';
import { NotesManagement } from './components/Admin/NotesManagement';
import { SystemSettings } from './components/Admin/SystemSettings';
import { TuitionManagement } from './components/Admin/TuitionManagement';
import { Button } from './components/ui/button';


// Wrappers for components that need navigation or location state
function SellBookFlowWrapper() {
  const navigate = useNavigate();
  return <SellBookFlow onClose={() => navigate('/')} />;
}

function ExchangeBookFlowWrapper() {
  const navigate = useNavigate();
  return <ExchangeBookFlow onClose={() => navigate('/')} />;
}

function RentBookFlowWrapper() {
  const navigate = useNavigate();
  return <RentBookFlow onClose={() => navigate('/')} />;
}

function PrivateChatWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { otherUser, bookContext } = location.state || {};
  const [user] = useAuthState(auth);

  if (!otherUser) {
    return <Navigate to="/dashboard/chats" replace />;
  }

  const chatId = [user?.uid, otherUser.id].sort().join('_');

  return (
    <PrivateChat
      chatId={chatId}
      otherUser={otherUser}
      bookContext={bookContext}
      onBack={() => navigate(-1)}
      currentUserId={user?.uid || ''}
    />
  );
}

function PrivateChatByIdWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const [user] = useAuthState(auth);
  const stateOtherUser = location.state?.otherUser;
  const stateBookContext = location.state?.bookContext;

  const [otherUser, setOtherUser] = useState<{ id: string; name: string; avatar: string; online: boolean } | null>(
    stateOtherUser || null
  );
  const [loading, setLoading] = useState(!stateOtherUser);

  useEffect(() => {
    // If we already have otherUser from state, skip the fetch
    if (stateOtherUser || !chatId || !user?.uid) return;

    const fetchChatInfo = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (!chatDoc.exists()) {
          navigate('/dashboard/chats', { replace: true });
          return;
        }
        const data = chatDoc.data();
        const otherUid = (data.participants || []).find((p: string) => p !== user.uid);

        let name = 'User';
        let avatar = '';
        if (otherUid) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              name = userData.displayName || userData.name || 'User';
              avatar = userData.photoURL || userData.avatar || '';
            }
          } catch (err) {
            console.error('Failed to fetch user info:', err);
          }
        }

        setOtherUser({ id: otherUid || '', name, avatar, online: true });
      } catch (err) {
        console.error('Failed to load chat:', err);
        navigate('/dashboard/chats', { replace: true });
      } finally {
        setLoading(false);
      }
    };
    fetchChatInfo();
  }, [chatId, user?.uid, stateOtherUser, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading chat...</div>;
  }

  if (!otherUser || !chatId) {
    return <Navigate to="/dashboard/chats" replace />;
  }

  return (
    <PrivateChat
      chatId={chatId}
      otherUser={otherUser}
      bookContext={stateBookContext}
      onBack={() => navigate(-1)}
      currentUserId={user?.uid || ''}
    />
  );
}

function AboutPageWrapper() {
  const navigate = useNavigate();
  return <AboutPage onBack={() => navigate('/')} />;
}

function CommunitiesBrowseWrapper() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  return (
    <CommunitiesBrowse
      isLoggedIn={!!user}
      onNavigateToDetail={(id) => navigate(`/communities/${id}`)}
      onNavigateToCreate={() => navigate('/communities/create')}
      onBack={() => navigate('/')}
    />
  );
}

function CreateCommunityWrapper() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  return (
    <CreateCommunity
      userId={user?.uid || ''}
      userName={user?.displayName || ''}
      onBack={() => navigate('/communities')}
      onSuccess={() => navigate('/communities')}
    />
  );
}

function GroupChatWrapper() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { id } = useParams();
  return <GroupChat currentUserId={user?.uid || ''} communityId={id || ''} communityName="Community" onBack={() => navigate('/communities/' + id)} />;
}

function DashboardWishlistWrapper() {
  const navigate = useNavigate();
  return (
    <Wishlist
      onNavigateToMarketplace={(opts) =>
        navigate('/marketplace', {
          state:
            opts?.pickForWishlist === true
              ? {
                  pickForWishlist: true,
                  wishlistType: opts.wishlistType ?? 'buy',
                  wishlistReturnTo: '/dashboard/wishlist',
                }
              : undefined,
        })
      }
    />
  );
}

function AdvancedSearchWrapper() {
  const navigate = useNavigate();
  return <AdvancedSearch onBack={() => navigate('/')} />;
}

function WishlistPageWrapper() {
  const navigate = useNavigate();
  return (
    <WishlistPage
      onBack={() => navigate('/')}
      onNavigateToMarketplace={(opts) =>
        navigate('/marketplace', {
          state:
            opts?.pickForWishlist === true
              ? { pickForWishlist: true, wishlistType: opts.wishlistType ?? 'buy' }
              : undefined,
        })
      }
      onNavigateToBook={(bookId) => navigate(`/book/${bookId}`)}
    />
  );
}

function TuitionHubWrapper() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  return <TuitionHub isLoggedIn={!!user} onBack={() => navigate('/')} />;
}

function NotesHubWrapper() {
  return <NotesHub />;
}

function DeliveryTrackingWrapper() {
  return <DeliveryTracking />;
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

function AppContent() {
  const { user, loading } = useUserRole();

  const handleLogout = () => {
    auth.signOut();
    // UserRoleContext handles state updates automatically via onAuthStateChanged
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginForm onLogin={() => { }} />} />
          <Route path="/register" element={<SignUpForm onSignUp={() => { }} />} />
          <Route path="/admin/login" element={<AdminLogin onLogin={() => { }} />} />
        </Route>

        {/* Main App Routes */}
        <Route element={<MainLayout isLoggedIn={!!user} onLogout={handleLogout} />}>
          {/* Public Routes */}
          <Route path="/" element={<HomeScreen isLoggedIn={!!user} />} />
          <Route path="/about" element={<AboutPageWrapper />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute isLoggedIn={!!user} />}>
            <Route path="/marketplace" element={<BookMarketplace />} />
            <Route path="/book/:id" element={<BookDetailsPage />} />
            <Route path="/sell" element={<SellBookFlowWrapper />} />
            <Route path="/rent" element={<RentBookFlowWrapper />} />
            <Route path="/rental/:rentalId/handover" element={<RentalHandoverPage />} />
            <Route path="/exchange" element={<ExchangeBookFlowWrapper />} />

            <Route path="/communities" element={<CommunitiesBrowseWrapper />} />
            <Route path="/communities/create" element={<CreateCommunityWrapper />} />
            <Route path="/communities/:id" element={<CommunityDetails userId={user?.uid} />} />
            <Route path="/communities/:id/chat" element={<GroupChatWrapper />} />

            <Route path="/chat" element={<PrivateChatWrapper />} />
            <Route path="/chat/:chatId" element={<PrivateChatByIdWrapper />} />

            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/search" element={<AdvancedSearchWrapper />} />
            <Route path="/wishlist" element={<WishlistPageWrapper />} />

            <Route path="/tuition" element={<TuitionHubWrapper />} />
            <Route path="/notes" element={<NotesHub />} />
            <Route path="/assistant" element={<AIAssistantPage />} />
            <Route path="/tracking/:orderId" element={<DeliveryTracking />} />

            <Route path="/dashboard" element={<UserDashboard onLogout={handleLogout} />}>
              <Route index element={<UserProfile />} />
              <Route path="reservations" element={<UserReservations />} />
              <Route path="purchases" element={<PurchaseHistory />} />
              <Route path="sales" element={<SalesHistory />} />
              <Route path="rentals" element={<RentalHistory />} />
              <Route path="wishlist" element={<DashboardWishlistWrapper />} />
              <Route path="communities" element={<UserCommunities />} />
              <Route path="chats" element={<UserChats />} />
              <Route path="exchanges" element={<UserExchanges />} />
              <Route path="negotiations" element={<NegotiationInbox />} />
            </Route>

            <Route path="/tutor-verification" element={<TutorVerificationForm />} />
          </Route>

        </Route>

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard onLogout={handleLogout} />}>
            <Route index element={<UserManagement />} />
            <Route path="books" element={<BookInventory />} />
            <Route path="rentals" element={<RentalManagement />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="communities" element={<CommunityManagement />} />
            <Route path="notes" element={<NotesManagement />} />
            <Route path="tuition" element={<TuitionManagement />} />
            <Route path="announcements" element={<AdminAnnouncementsWrapper />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && <AIChatbox />}
    </Router>
  );
}

export default function App() {
  return (
    <UserRoleProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </UserRoleProvider>
  );
}