import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Button } from '../ui/button';

interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  type: 'info' | 'promo' | 'update';
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '🎉 New Feature: Book Communities!',
    content: 'Join communities, discuss your favorite books, and connect with fellow readers.',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&h=400&fit=crop',
    date: 'Nov 14, 2024',
    type: 'update'
  },
  {
    id: '2',
    title: '📚 Special Offer: 20% Off Textbooks',
    content: 'Get 20% off all textbook purchases this week. Limited time offer!',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=400&fit=crop',
    date: 'Nov 13, 2024',
    type: 'promo'
  },
  {
    id: '3',
    title: '🔔 Rental Period Extended',
    content: 'All active rentals automatically extended by 7 days. No additional charge!',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=400&fit=crop',
    date: 'Nov 12, 2024',
    type: 'info'
  }
];

interface AnnouncementCarouselProps {
  onViewAll: () => void;
}

export function AnnouncementCarousel({ onViewAll }: AnnouncementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const announcements = mockAnnouncements.slice(0, 3); // Top 3 recent

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, announcements.length]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const currentAnnouncement = announcements[currentIndex];

  const getBgColor = (type: Announcement['type']) => {
    switch (type) {
      case 'promo':
        return 'from-[#C4A672] to-[#8B7355]';
      case 'update':
        return 'from-[#2C3E50] to-[#34495E]';
      default:
        return 'from-[#3498db] to-[#2980b9]';
    }
  };

  return (
    <div className="relative w-full bg-gradient-to-r overflow-hidden">
      {/* Main Carousel */}
      <div className="relative h-64 md:h-80">
        {announcements.map((announcement, index) => (
          <div
            key={announcement.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image (if available) */}
            {announcement.image && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${announcement.image})` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${getBgColor(announcement.type)} opacity-90`} />
              </div>
            )}
            
            {/* Content */}
            <div className={`relative h-full ${!announcement.image ? `bg-gradient-to-r ${getBgColor(announcement.type)}` : ''}`}>
              <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
                <div className="text-white max-w-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-5 h-5" />
                    <span className="text-sm opacity-90">{announcement.date}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl mb-4">{announcement.title}</h2>
                  <p className="text-lg md:text-xl opacity-95 mb-6">{announcement.content}</p>
                  <Button
                    onClick={onViewAll}
                    variant="secondary"
                    size="lg"
                    className="bg-white text-[#2C3E50] hover:bg-gray-100"
                  >
                    View All Announcements →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {announcements.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'w-8 bg-white'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
