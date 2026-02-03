// Updated src/components/Home/AnnouncementCarousel.tsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { db } from '../../firebase';  // Adjust path if needed
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

interface Announcement {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  type: 'info' | 'promo' | 'update';
}

interface AnnouncementCarouselProps {
  onViewAll: () => void;
}

// Default announcements data
const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'default-1',
    title: 'Welcome to BookBloom!',
    content: 'Join our thriving community of book lovers. Trade, sell, and discover your next favorite read with ease.',
    date: new Date().toLocaleDateString(),
    type: 'info',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'default-2',
    title: 'Grand Opening Special',
    content: 'Zero fees on your first 5 book sales! Start listing your collection today and keep 100% of your earnings.',
    date: new Date().toLocaleDateString(),
    type: 'promo',
    image: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=1000'
  },
  {
    id: 'default-3',
    title: 'New Feature: Community Hubs',
    content: 'Connect with readers who share your interests. Create or join book clubs, discussion groups, and more.',
    date: new Date().toLocaleDateString(),
    type: 'update',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1000'
  }
];

export function AnnouncementCarousel({ onViewAll }: AnnouncementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(3));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setAnnouncements(DEFAULT_ANNOUNCEMENTS);
        } else {
          const data = snapshot.docs.map(doc => {
            const d = doc.data();
            let dateStr = '';
            // Handle Firestore Timestamp
            if (d.date && typeof d.date.toDate === 'function') {
              dateStr = d.date.toDate().toLocaleDateString();
            } else if (d.date instanceof Date) {
              dateStr = d.date.toLocaleDateString();
            } else if (d.date) {
              try {
                dateStr = new Date(d.date).toLocaleDateString();
              } catch (e) {
                dateStr = 'Unknown Date';
              }
            }

            return {
              id: doc.id,
              ...d,
              date: dateStr
            } as Announcement;
          });
          setAnnouncements(data);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || announcements.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
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

  if (isLoading) {
    return (
      <div className="w-full h-64 md:h-80 bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-gray-400">Loading announcements...</span>
      </div>
    );
  }

  if (announcements.length === 0) return null;

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
            className={`absolute inset-0 transition-opacity duration-500 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
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
            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
              ? 'w-8 bg-white'
              : 'bg-white/50 hover:bg-white/75'
              }`}
          />
        ))}
      </div>
    </div>
  );
}