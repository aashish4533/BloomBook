import { useState, useEffect } from 'react';
import { AnnouncementCarousel } from './Home/AnnouncementCarousel';
import { FeaturedBooks } from './Home/FeaturedBooks';
import { CommunitiesSection } from './Home/CommunitiesSection';
import { NotificationCarousel } from './NotificationCarousel';
import { AIRecommendations } from './AIRecommendations';
import { Search, Bell, BookOpen } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

interface HomeScreenProps {
  isLoggedIn: boolean;
}

export function HomeScreen({ isLoggedIn }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'rent'>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ books: 0, users: 0, communities: 0, readers: 0 });
  const user = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    // Real-time listeners for stats
    const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
      setStats(prev => ({ ...prev, books: snap.size }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });

    const unsubCommunities = onSnapshot(collection(db, 'communities'), (snap) => {
      setStats(prev => ({ ...prev, communities: snap.size }));
    });

    const unsubReaders = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, readers: snap.size }));
    });

    return () => {
      unsubBooks();
      unsubUsers();
      unsubCommunities();
      unsubReaders();
    };
  }, []);

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
      <AnnouncementCarousel onViewAll={() => navigate('/announcements')} />

      {/* Notification Carousel */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <NotificationCarousel
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2C3E50] to-[#1a252f] rounded-3xl p-8 md:p-12 shadow-2xl border border-[#C4A672]/30">
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Column */}
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                Knowledge that <span className="text-[#C4A672] inline-block animate-pulse-slow">Grows</span>
              </h1>
              <p className="text-lg text-gray-300 max-w-lg">
                Join the most vibrant community of book lovers. Buy, sell, rent, and exchange books in a thriving ecosystem designed for knowledge seekers.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => navigate('/marketplace')}
                  className="bg-[#C4A672] hover:bg-[#d6b783] text-[#2C3E50] font-bold rounded-full px-8 py-6 text-lg shadow-[0_0_20px_rgba(196,166,114,0.3)] hover:shadow-[0_0_25px_rgba(196,166,114,0.5)] transition-all transform hover:-translate-y-1"
                >
                  Start Exploring
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/communities')}
                  className="border-2 border-white/30 text-white hover:bg-white/10 bg-transparent rounded-full px-8 py-6 text-lg hover:border-white transition-all transform hover:-translate-y-1"
                >
                  Join Community
                </Button>
              </div>
            </div>

            {/* Right Column */}
            <div className="hidden md:block relative h-[450px]">
              <div className="absolute inset-0 bg-[#C4A672] rounded-2xl transform rotate-6 opacity-20 blur-sm"></div>
              <img
                src="https://images.unsplash.com/photo-1507842217153-e21f40668bc9?auto=format&fit=crop&q=80&w=1000"
                alt="Library Atmosphere"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-700 ease-out border border-[#C4A672]/20"
              />
              {/* Floating Badge */}
              <div className="absolute bottom-8 -left-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-[#2C3E50]" />
                  </div>
                  <div>
                    <p className="text-[#C4A672] font-bold">1 Million+</p>
                    <p className="text-xs text-gray-300">Books Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C4A672] rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-8 -left-8 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div
          className="relative cursor-pointer shadow-subtle rounded-lg transition-smooth hover:shadow-card"
          onClick={() => navigate('/search')}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search books by title, author, ISBN, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => navigate('/search')}
            className="pl-12 pr-4 h-14 text-lg bg-white border-2 border-blue-600/30 focus:border-blue-600 focus-glow cursor-pointer"
            readOnly
          />
        </div>

        {/* Quick Filters */}
        {/* Quick Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace', { state: { category: 'Fiction' } })} className="rounded-full hover:bg-blue-50 transition-smooth">
            📚 Fiction
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace', { state: { category: 'Science' } })} className="rounded-full hover:bg-blue-50 transition-smooth">
            🔬 Science
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace', { state: { category: 'Business' } })} className="rounded-full hover:bg-blue-50 transition-smooth">
            💼 Business
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace', { state: { category: 'Art' } })} className="rounded-full hover:bg-blue-50 transition-smooth">
            🎨 Art
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace', { state: { category: 'Textbooks' } })} className="rounded-full hover:bg-blue-50 transition-smooth">
            📖 Textbooks
          </Button>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="max-w-7xl mx-auto px-4">
        <AIRecommendations context="home" onBookClick={(id) => navigate(`/book/${id}`)} />
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
              variant="outline"
              onClick={() => navigate('/marketplace')}
              className="hover:bg-blue-50 border-blue-200 text-blue-700"
            >
              Buy
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/sell')}
              className="hover:bg-blue-50 border-blue-200 text-blue-700"
            >
              Sell
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/rent')}
              className="hover:bg-blue-50 border-blue-200 text-blue-700"
            >
              Rent
            </Button>
          </div>
        </div>

        <FeaturedBooks
          activeTab={activeTab}
          onNavigateToBook={(id) => navigate(`/book/${id}`)}
          onExplore={() => {
            if (activeTab === 'buy') navigate('/marketplace');
            else if (activeTab === 'sell') navigate('/sell');
            else if (activeTab === 'rent') navigate('/rent');
          }}
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
              onClick={() => navigate('/communities')}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale shadow-subtle"
            >
              Browse All →
            </Button>
          </div>

          <CommunitiesSection
            onNavigateToCommunities={() => navigate('/communities')}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">{stats.books.toLocaleString()}</div>
            <div className="text-gray-600">Books Listed</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">{stats.users.toLocaleString()}</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">{stats.communities.toLocaleString()}</div>
            <div className="text-gray-600">Communities</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-card border border-gray-100 transition-smooth hover:shadow-hover">
            <div className="text-4xl text-blue-600 mb-2">{stats.readers.toLocaleString()}</div>
            <div className="text-gray-600">Happy Readers</div>
          </div>
        </div>
      </div>
    </div>
  );
}