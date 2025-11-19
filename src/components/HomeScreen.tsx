import { useState } from 'react';
import { AnnouncementCarousel } from './Home/AnnouncementCarousel';
import { FeaturedBooks } from './Home/FeaturedBooks';
import { CommunitiesSection } from './Home/CommunitiesSection';
<<<<<<< HEAD
import { NotificationCarousel } from './NotificationCarousel';
import { AIRecommendations } from './AIRecommendations';
=======
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
import { Search, Bell } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

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
<<<<<<< HEAD
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Welcome to Book Bloom! 🌸',
      message: 'Discover thousands of books and connect with readers worldwide',
      timestamp: '5 mins ago',
      type: 'info' as const,
      read: false
    },
    {
      id: '2',
      title: 'New Community Feature',
      message: 'Join book communities and participate in discussions',
      timestamp: '1 hour ago',
      type: 'success' as const,
      read: false
    }
  ]);

  const handleDismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };
=======
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-0">
      {/* Announcement Carousel - Top */}
      <AnnouncementCarousel onViewAll={onNavigateToAnnouncements} />
<<<<<<< HEAD
      
      {/* Notification Carousel */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <NotificationCarousel 
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>
=======
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div 
<<<<<<< HEAD
          className="relative cursor-pointer shadow-subtle rounded-lg transition-smooth hover:shadow-card"
=======
          className="relative cursor-pointer"
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
          onClick={onNavigateToSearch}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search books by title, author, ISBN, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onNavigateToSearch}
<<<<<<< HEAD
            className="pl-12 pr-4 h-14 text-lg bg-white border-2 border-blue-600/30 focus:border-blue-600 focus-glow cursor-pointer"
=======
            className="pl-12 pr-4 h-14 text-lg bg-white border-2 border-[#C4A672]/30 focus:border-[#C4A672] cursor-pointer"
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            readOnly
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
<<<<<<< HEAD
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
=======
          <Button variant="outline" size="sm" className="rounded-full">
            📚 Fiction
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            🔬 Science
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            💼 Business
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            🎨 Art
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            📖 Textbooks
          </Button>
        </div>
      </div>
<<<<<<< HEAD
      
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
=======

      {/* Featured Books Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#2C3E50] text-3xl">Featured Books</h2>
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'buy' ? 'default' : 'outline'}
              onClick={() => setActiveTab('buy')}
<<<<<<< HEAD
              className={activeTab === 'buy' ? 'bg-blue-600 hover:bg-blue-700 transition-smooth btn-scale' : 'hover:bg-gray-50'}
=======
              className={activeTab === 'buy' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            >
              Buy
            </Button>
            <Button
              variant={activeTab === 'sell' ? 'default' : 'outline'}
              onClick={() => setActiveTab('sell')}
<<<<<<< HEAD
              className={activeTab === 'sell' ? 'bg-blue-600 hover:bg-blue-700 transition-smooth btn-scale' : 'hover:bg-gray-50'}
=======
              className={activeTab === 'sell' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            >
              Sell
            </Button>
            <Button
              variant={activeTab === 'rent' ? 'default' : 'outline'}
              onClick={() => setActiveTab('rent')}
<<<<<<< HEAD
              className={activeTab === 'rent' ? 'bg-blue-600 hover:bg-blue-700 transition-smooth btn-scale' : 'hover:bg-gray-50'}
=======
              className={activeTab === 'rent' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
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
<<<<<<< HEAD
      <div className="bg-gradient-to-b from-blue-50 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900 text-3xl mb-2">Book Communities</h2>
=======
      <div className="bg-gradient-to-b from-[#C4A672]/10 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[#2C3E50] text-3xl mb-2">Book Communities</h2>
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
              <p className="text-gray-600">Connect with readers who share your interests</p>
            </div>
            <Button
              onClick={onNavigateToCommunities}
<<<<<<< HEAD
              className="bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale shadow-subtle"
=======
              className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
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
<<<<<<< HEAD
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
=======
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl text-[#C4A672] mb-2">15K+</div>
            <div className="text-gray-600">Books Listed</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl text-[#C4A672] mb-2">8K+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl text-[#C4A672] mb-2">120+</div>
            <div className="text-gray-600">Communities</div>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="text-4xl text-[#C4A672] mb-2">5K+</div>
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            <div className="text-gray-600">Happy Readers</div>
          </div>
        </div>
      </div>
    </div>
  );
}