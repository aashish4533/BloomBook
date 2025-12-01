import { useState, useEffect } from 'react';
import { AnnouncementCarousel } from './Home/AnnouncementCarousel';
import { FeaturedBooks } from './Home/FeaturedBooks';
import { CommunitiesSection } from './Home/CommunitiesSection';
import { NotificationCarousel } from './NotificationCarousel';
import { AIRecommendations } from './AIRecommendations';
import { Search, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

interface HomeScreenProps {
  onNavigateToCommunities: () => void;
  onNavigateToBook: (bookId: string) => void;
  onNavigateToAnnouncements: () => void;
  onNavigateToSearch?: () => void;
  isLoggedIn: boolean;
}

export function HomeScreen({
  onNavigateToCommunities,
  onNavigateToBook,
  onNavigateToAnnouncements,
  onNavigateToSearch,
  isLoggedIn
}: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'rent'>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const fetchNotifications = async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          timestamp: d.timestamp?.toDate ? d.timestamp.toDate().toLocaleDateString() : d.timestamp
        } as Notification;
      });
      setNotifications(data);
    };
    fetchNotifications();
  }, [isLoggedIn, user]);

  const handleDismissNotification = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to dismiss notification');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-0">
      {/* Announcement Carousel - Top */}
      <AnnouncementCarousel onViewAll={onNavigateToAnnouncements} />

      {/* Notification Carousel */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <NotificationCarousel
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div
          className="relative cursor-pointer shadow-subtle rounded-lg transition-smooth hover:shadow-card"
          onClick={onNavigateToSearch}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search books by title, author, ISBN, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onNavigateToSearch}
            className="pl-12 pr-4 h-14 text-lg bg-white border-2 border-blue-600/30 focus:border-blue-600 focus-glow cursor-pointer"
            readOnly
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-full hover:bg-blue-50 transition-smooth">
            📚 Fiction
          </Button>
          <Button variant="outline" size="sm" className="rounded-full hover:bg-blue-50 transition-smooth">
            🔬 Science
          </Button>
          <Button variant="outline" size="sm" className="rounded-full hover:bg-blue-50 transition-smooth">
            💼 Business
          </Button>
          <Button variant="outline" size="sm" className="rounded-full hover:bg-blue-50 transition-smooth">
            🎨 Art
          </Button>
          <Button variant="outline" size="sm" className="rounded-full hover:bg-blue-50 transition-smooth">
            📖 Textbooks
          </Button>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="max-w-7xl mx-auto px-4">
        <AIRecommendations context="home" onBookClick={onNavigateToBook} />
      </div>

      {/* Featured Books Section - Book Marketplace */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900 text-3xl mb-1">Book Marketplace</h2>
            <p className="text-gray-600">Buy, sell, or rent your favorite books</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'buy' ? 'default' : 'outline'}
              onClick={() => setActiveTab('buy')}
              className={activeTab === 'buy' ? 'bg-blue-600 hover:bg-blue-700 transition-smooth btn-scale' : 'hover:bg-gray-50'}
            >
              Buy
            </Button>
            <Button
              variant={activeTab === 'sell' ? 'default' : 'outline'}
              onClick={() => setActiveTab('sell')}
              className={activeTab === 'sell' ? 'bg-blue-600 hover:bg-blue-700 transition-smooth btn-scale' : 'hover:bg-gray-50'}
            >
              Sell
            </Button>
            <Button
              variant={activeTab === 'rent' ? 'default' : 'outline'}
              onClick={() => setActiveTab('rent')}
              className={activeTab === 'rent' ? 'bg-blue-600 hover:bg-blue-700 transition-smooth btn-scale' : 'hover:bg-gray-50'}
            >
              Rent
            </Button>
          </div>
        </div>

        <FeaturedBooks
          activeTab={activeTab}
          onNavigateToBook={onNavigateToBook}
        />
      </div>

      {/* Communities Section */}
      <div className="bg-gradient-to-b from-blue-50 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-3xl mb-2">Book Communities</h2>
              <p className="text-gray-600">Connect with readers who share your interests</p>
            </div>
            <Button
              onClick={onNavigateToCommunities}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale shadow-subtle"
            >
              Browse All →
            </Button>
          </div>

          <CommunitiesSection
            onNavigateToCommunities={onNavigateToCommunities}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">15K+</div>
            <div className="text-gray-600">Books Listed</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">8K+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">120+</div>
            <div className="text-gray-600">Communities</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">5K+</div>
            <div className="text-gray-600">Happy Readers</div>
          </div>
        </div>
      </div>
    </div>
  );
}