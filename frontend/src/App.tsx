import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginForm } from './components/LoginForm';
import { SignUpForm } from './components/SignUpForm';
import { HomeScreen } from './components/HomeScreen';
import { BookMarketplace } from './components/BookMarketplace';
import { ChatButton } from './components/ChatButton';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { RentBookFlow } from './components/RentBookFlow';
import { LogoutConfirmation } from './components/LogoutConfirmation';
import { SellBookFlow } from './components/SellBookFlow';
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
import { PaymentGateway } from './components/Payment/PaymentGateway';
import { DeliveryTracking } from './components/DeliveryTracking';
import { BarcodeScanner } from './components/BarcodeScanner';
import { VideoPlayer } from './components/VideoPlayer';
import { NotesViewer } from './components/NotesViewer';
import { ErrorModal } from './components/ErrorModal';
import { LoadingState } from './components/LoadingState';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

type PageType =
  | 'home'
  | 'marketplace'
  | 'login'
  | 'signup'
  | 'admin-login'
  | 'admin-dashboard'
  | 'user-dashboard'
  | 'rent'
  | 'sell'
  | 'communities-browse'
  | 'communities-create'
  | 'community-detail'
  | 'group-chat'
  | 'private-chat'
  | 'announcements'
  | 'about'
  | 'advanced-search'
  | 'wishlist'
  | 'tuition'
  | 'delivery-tracking';

interface PaymentContext {
  amount: number;
  type: 'buy' | 'rent' | 'tuition';
  itemTitle: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [chatContext, setChatContext] = useState<{
    otherUser: { id: string; name: string; avatar: string; online: boolean };
    bookContext?: { id: string; title: string; price: number; image: string };
  } | null>(null);

  // New modal states
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showNotesViewer, setShowNotesViewer] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // TODO: Fetch role from Firestore or user metadata if needed
        setUserRole('user');  // Default to 'user'; adjust for 'admin' logic
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = () => {
    setUserRole('admin');
    setCurrentPage('admin-dashboard');
  };

  const handleUserLogin = () => {
    setUserRole('user');
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setUserRole(null);
    setCurrentPage('login'); // Redirect to login page
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleNavigateToCommunities = () => {
    setCurrentPage('communities-browse');
  };

  const handleNavigateToCommunityDetail = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setCurrentPage('community-detail');
  };

  const handleNavigateToCreateCommunity = () => {
    setCurrentPage('communities-create');
  };

  const handleCommunityCreated = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setCurrentPage('community-detail');
  };

  const handleOpenChat = (otherUser: any, bookContext?: any) => {
    setChatContext({ otherUser, bookContext });
    setCurrentPage('private-chat');
  };

  // Full-page components (no navbar/footer)
  if (currentPage === 'admin-login') {
    return <AdminLogin onLogin={handleAdminLogin} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'admin-dashboard') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (currentPage === 'user-dashboard') {
    return (
      <>
        <UserDashboard
          onLogout={handleLogout}
          onNavigateToMarketplace={() => setCurrentPage('marketplace')}
          onNavigateToRent={() => setCurrentPage('rent')}
          onNavigateToSell={() => setCurrentPage('sell')}
          onNavigateToCommunities={handleNavigateToCommunities}
          onNavigateToAdminLogin={() => setCurrentPage('admin-login')}
        />
        {showLogoutConfirm && (
          <LogoutConfirmation onConfirm={confirmLogout} onCancel={cancelLogout} />
        )}
      </>
    );
  }

  if (currentPage === 'communities-create') {
    return (
      <CreateCommunity
        onBack={() => setCurrentPage('communities-browse')}
        onSuccess={handleCommunityCreated}
        userId="current-user-id"
        userName="Current User"
      />
    );
  }

  if (currentPage === 'community-detail' && selectedCommunityId) {
    return (
      <CommunityDetails
        communityId={selectedCommunityId}
        onBack={() => setCurrentPage('communities-browse')}
        onNavigateToChat={(communityId) => {
          setSelectedCommunityId(communityId);
          setCurrentPage('group-chat');
        }}
        isAdmin={false} // TODO: Check if user is admin
        isMember={true} // TODO: Check if user is member
        userId="current-user-id"
      />
    );
  }

  if (currentPage === 'group-chat' && selectedCommunityId) {
    return (
      <GroupChat
        communityId={selectedCommunityId}
        communityName="Science Fiction Lovers" // TODO: Get from state
        onBack={() => setCurrentPage('community-detail')}
        currentUserId="current-user-id"
      />
    );
  }

  if (currentPage === 'private-chat' && chatContext) {
    return (
      <PrivateChat
        otherUser={chatContext.otherUser}
        bookContext={chatContext.bookContext}
        onBack={() => setCurrentPage('marketplace')}
        currentUserId="current-user-id"
      />
    );
  }

  if (currentPage === 'announcements') {
    return <AnnouncementsPage isAdmin={userRole === 'admin'} onBack={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'about') {
    return (
      <>
        <Navbar
          isLoggedIn={userRole === 'user'}
          currentPage={currentPage}
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateBuy={() => setCurrentPage('marketplace')}
          onNavigateRent={() => setCurrentPage('rent')}
          onNavigateSell={() => setCurrentPage('sell')}
          onNavigateCommunities={handleNavigateToCommunities}
          onNavigateSearch={() => setCurrentPage('advanced-search')}
          onNavigateWishlist={() => setCurrentPage('wishlist')}
          onNavigateTuition={() => setCurrentPage('tuition')}
          onNavigateAnnouncements={() => setCurrentPage('announcements')}
          onNavigateAbout={() => setCurrentPage('about')}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('signup')}
          onNavigateProfile={() => setCurrentPage('user-dashboard')}
          onLogout={handleLogout}
        />
        <AboutPage
          onBack={() => setCurrentPage('home')}
          onNavigateToCommunities={handleNavigateToCommunities}
        />
        <Footer
          onNavigateToAbout={() => setCurrentPage('about')}
          onNavigateToBuy={() => setCurrentPage('marketplace')}
          onNavigateToRent={() => setCurrentPage('rent')}
          onNavigateToSell={() => setCurrentPage('sell')}
          onNavigateToAnnouncements={() => setCurrentPage('announcements')}
        />
      </>
    );
  }

  if (currentPage === 'advanced-search') {
    return (
      <>
        <Navbar
          isLoggedIn={userRole === 'user'}
          currentPage={currentPage}
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateBuy={() => setCurrentPage('marketplace')}
          onNavigateRent={() => setCurrentPage('rent')}
          onNavigateSell={() => setCurrentPage('sell')}
          onNavigateCommunities={handleNavigateToCommunities}
          onNavigateSearch={() => setCurrentPage('advanced-search')}
          onNavigateWishlist={() => setCurrentPage('wishlist')}
          onNavigateTuition={() => setCurrentPage('tuition')}
          onNavigateAnnouncements={() => setCurrentPage('announcements')}
          onNavigateAbout={() => setCurrentPage('about')}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('signup')}
          onNavigateProfile={() => setCurrentPage('user-dashboard')}
          onLogout={handleLogout}
        />
        <AdvancedSearch
          onBack={() => setCurrentPage('home')}
          onNavigateToBook={(bookId) => {
            setSelectedBookId(bookId);
            setCurrentPage('marketplace');
          }}
        />
        <Footer
          onNavigateToAbout={() => setCurrentPage('about')}
          onNavigateToBuy={() => setCurrentPage('marketplace')}
          onNavigateToRent={() => setCurrentPage('rent')}
          onNavigateToSell={() => setCurrentPage('sell')}
          onNavigateToAnnouncements={() => setCurrentPage('announcements')}
        />
      </>
    );
  }

  if (currentPage === 'wishlist') {
    return (
      <>
        <Navbar
          isLoggedIn={userRole === 'user'}
          currentPage={currentPage}
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateBuy={() => setCurrentPage('marketplace')}
          onNavigateRent={() => setCurrentPage('rent')}
          onNavigateSell={() => setCurrentPage('sell')}
          onNavigateCommunities={handleNavigateToCommunities}
          onNavigateSearch={() => setCurrentPage('advanced-search')}
          onNavigateWishlist={() => setCurrentPage('wishlist')}
          onNavigateTuition={() => setCurrentPage('tuition')}
          onNavigateAnnouncements={() => setCurrentPage('announcements')}
          onNavigateAbout={() => setCurrentPage('about')}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('signup')}
          onNavigateProfile={() => setCurrentPage('user-dashboard')}
          onLogout={handleLogout}
        />
        <WishlistPage
          onBack={() => setCurrentPage('home')}
          onNavigateToMarketplace={() => setCurrentPage('marketplace')}
          onNavigateToBook={(bookId) => {
            setSelectedBookId(bookId);
            setCurrentPage('marketplace');
          }}
        />
        <Footer
          onNavigateToAbout={() => setCurrentPage('about')}
          onNavigateToBuy={() => setCurrentPage('marketplace')}
          onNavigateToRent={() => setCurrentPage('rent')}
          onNavigateToSell={() => setCurrentPage('sell')}
          onNavigateToAnnouncements={() => setCurrentPage('announcements')}
        />
      </>
    );
  }

  if (currentPage === 'tuition') {
    return (
      <>
        <Navbar
          isLoggedIn={userRole === 'user'}
          currentPage={currentPage}
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateBuy={() => setCurrentPage('marketplace')}
          onNavigateRent={() => setCurrentPage('rent')}
          onNavigateSell={() => setCurrentPage('sell')}
          onNavigateCommunities={handleNavigateToCommunities}
          onNavigateSearch={() => setCurrentPage('advanced-search')}
          onNavigateWishlist={() => setCurrentPage('wishlist')}
          onNavigateTuition={() => setCurrentPage('tuition')}
          onNavigateAnnouncements={() => setCurrentPage('announcements')}
          onNavigateAbout={() => setCurrentPage('about')}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('signup')}
          onNavigateProfile={() => setCurrentPage('user-dashboard')}
          onLogout={handleLogout}
        />
        <TuitionHub
          onBack={() => setCurrentPage('home')}
          isLoggedIn={userRole === 'user'}
        />
        <Footer
          onNavigateToAbout={() => setCurrentPage('about')}
          onNavigateToBuy={() => setCurrentPage('marketplace')}
          onNavigateToRent={() => setCurrentPage('rent')}
          onNavigateToSell={() => setCurrentPage('sell')}
          onNavigateToAnnouncements={() => setCurrentPage('announcements')}
        />
      </>
    );
  }

  if (currentPage === 'delivery-tracking') {
    return (
      <>
        <Navbar
          isLoggedIn={userRole === 'user'}
          currentPage={currentPage}
          onNavigateHome={() => setCurrentPage('home')}
          onNavigateBuy={() => setCurrentPage('marketplace')}
          onNavigateRent={() => setCurrentPage('rent')}
          onNavigateSell={() => setCurrentPage('sell')}
          onNavigateCommunities={handleNavigateToCommunities}
          onNavigateSearch={() => setCurrentPage('advanced-search')}
          onNavigateWishlist={() => setCurrentPage('wishlist')}
          onNavigateTuition={() => setCurrentPage('tuition')}
          onNavigateAnnouncements={() => setCurrentPage('announcements')}
          onNavigateAbout={() => setCurrentPage('about')}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('signup')}
          onNavigateProfile={() => setCurrentPage('user-dashboard')}
          onLogout={handleLogout}
        />
        <DeliveryTracking
          onBack={() => setCurrentPage('home')}
          orderId={currentOrderId}
        />
        <Footer
          onNavigateToAbout={() => setCurrentPage('about')}
          onNavigateToBuy={() => setCurrentPage('marketplace')}
          onNavigateToRent={() => setCurrentPage('rent')}
          onNavigateToSell={() => setCurrentPage('sell')}
          onNavigateToAnnouncements={() => setCurrentPage('announcements')}
        />
      </>
    );
  }

  // Regular pages with navbar/footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        isLoggedIn={userRole === 'user'}
        currentPage={currentPage}
        onNavigateHome={() => setCurrentPage('home')}
        onNavigateBuy={() => setCurrentPage('marketplace')}
        onNavigateRent={() => setCurrentPage('rent')}
        onNavigateSell={() => setCurrentPage('sell')}
        onNavigateCommunities={handleNavigateToCommunities}
        onNavigateSearch={() => setCurrentPage('advanced-search')}
        onNavigateWishlist={() => setCurrentPage('wishlist')}
        onNavigateTuition={() => setCurrentPage('tuition')}
        onNavigateAnnouncements={() => setCurrentPage('announcements')}
        onNavigateAbout={() => setCurrentPage('about')}
        onNavigateLogin={() => setCurrentPage('login')}
        onNavigateRegister={() => setCurrentPage('signup')}
        onNavigateProfile={() => setCurrentPage('user-dashboard')}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomeScreen
            onNavigateToCommunities={handleNavigateToCommunities}
            onNavigateToBook={(bookId) => {
              setSelectedBookId(bookId);
              setCurrentPage('marketplace');
            }}
            onNavigateToAnnouncements={() => setCurrentPage('announcements')}
            onNavigateToSearch={() => setCurrentPage('advanced-search')}
            isLoggedIn={userRole === 'user'}
          />
        )}
        {currentPage === 'marketplace' && (
          <BookMarketplace
            onBack={() => setCurrentPage('home')}
          />
        )}
        {currentPage === 'communities-browse' && (
          <CommunitiesBrowse
            onNavigateToDetail={handleNavigateToCommunityDetail}
            onNavigateToCreate={handleNavigateToCreateCommunity}
            onBack={() => setCurrentPage('home')}
            isLoggedIn={userRole === 'user'}
          />
        )}
        {currentPage === 'rent' && (
          <RentBookFlow onClose={() => setCurrentPage('home')} />
        )}
        {currentPage === 'sell' && (
          <SellBookFlow onClose={() => setCurrentPage('home')} />
        )}
        {currentPage === 'login' && (
          <LoginForm
            onSwitchToSignUp={() => setCurrentPage('signup')}
            onLogin={handleUserLogin}
          />
        )}
        {currentPage === 'signup' && (
          <SignUpForm
            onSwitchToLogin={() => setCurrentPage('login')}
            onSignUp={() => {
              handleUserLogin();
              setCurrentPage('home');
            }}
          />
        )}
        <ChatButton />

        {showLogoutConfirm && (
          <LogoutConfirmation onConfirm={confirmLogout} onCancel={cancelLogout} />
        )}

        {/* Payment Gateway Modal */}
        {showPaymentGateway && paymentContext && (
          <PaymentGateway
            amount={paymentContext.amount}
            type={paymentContext.type}
            itemTitle={paymentContext.itemTitle}
            onSuccess={(transactionId) => {
              setShowPaymentGateway(false);
              setCurrentOrderId(transactionId);
              setCurrentPage('delivery-tracking');
            }}
            onCancel={() => setShowPaymentGateway(false)}
          />
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScanner
            onScanComplete={(isbn) => {
              setShowBarcodeScanner(false);
              // Use scanned ISBN
            }}
            onCancel={() => setShowBarcodeScanner(false)}
          />
        )}

        {/* Video Player Modal */}
        {showVideoPlayer && (
          <VideoPlayer
            title="Lecture Video"
            description="Educational content"
            onClose={() => setShowVideoPlayer(false)}
            downloadable={true}
          />
        )}

        {/* Notes Viewer Modal */}
        {showNotesViewer && (
          <NotesViewer
            title="Study Notes"
            author="Book Bloom"
            onClose={() => setShowNotesViewer(false)}
            downloadable={true}
          />
        )}

        {/* Error Modal */}
        {showErrorModal && (
          <ErrorModal
            message={errorMessage}
            onClose={() => setShowErrorModal(false)}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <LoadingState fullScreen={true} message="Please wait..." />
        )}
      </main>
      <Footer
        onNavigateToAbout={() => setCurrentPage('about')}
        onNavigateToBuy={() => setCurrentPage('marketplace')}
        onNavigateToRent={() => setCurrentPage('rent')}
        onNavigateToSell={() => setCurrentPage('sell')}
        onNavigateToAnnouncements={() => setCurrentPage('announcements')}
      />
    </div>
  );
}