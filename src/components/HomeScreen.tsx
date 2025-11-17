import { useState } from 'react';
import { AnnouncementCarousel } from './Home/AnnouncementCarousel';
import { FeaturedBooks } from './Home/FeaturedBooks';
import { CommunitiesSection } from './Home/CommunitiesSection';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-0">
      {/* Announcement Carousel - Top */}
      <AnnouncementCarousel onViewAll={onNavigateToAnnouncements} />

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div 
          className="relative cursor-pointer"
          onClick={onNavigateToSearch}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search books by title, author, ISBN, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={onNavigateToSearch}
            className="pl-12 pr-4 h-14 text-lg bg-white border-2 border-[#C4A672]/30 focus:border-[#C4A672] cursor-pointer"
            readOnly
          />
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
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
            📖 Textbooks
          </Button>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#2C3E50] text-3xl">Featured Books</h2>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'buy' ? 'default' : 'outline'}
              onClick={() => setActiveTab('buy')}
              className={activeTab === 'buy' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
            >
              Buy
            </Button>
            <Button
              variant={activeTab === 'sell' ? 'default' : 'outline'}
              onClick={() => setActiveTab('sell')}
              className={activeTab === 'sell' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
            >
              Sell
            </Button>
            <Button
              variant={activeTab === 'rent' ? 'default' : 'outline'}
              onClick={() => setActiveTab('rent')}
              className={activeTab === 'rent' ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
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
      <div className="bg-gradient-to-b from-[#C4A672]/10 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[#2C3E50] text-3xl mb-2">Book Communities</h2>
              <p className="text-gray-600">Connect with readers who share your interests</p>
            </div>
            <Button
              onClick={onNavigateToCommunities}
              className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
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
            <div className="text-gray-600">Happy Readers</div>
          </div>
        </div>
      </div>
    </div>
  );
}