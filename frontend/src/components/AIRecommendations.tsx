// Updated src/components/AIRecommendations.tsx
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { BookCard } from './BookCard';
import { db } from '../firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

interface AIRecommendationsProps {
  context?: 'home' | 'search' | 'book-detail';
  onBookClick?: (bookId: string) => void;
}

export function AIRecommendations({ context = 'home', onBookClick }: AIRecommendationsProps) {
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const itemsToShow = 4;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'books'), limit(5));  // Example: top 5 books as recommendations
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecommendedBooks(data);
      } catch (err) {
        toast.error('Failed to fetch recommendations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(recommendedBooks.length - itemsToShow, prev + 1));
  };

  const visibleBooks = recommendedBooks.slice(startIndex, startIndex + itemsToShow);
  const canGoPrevious = startIndex > 0;
  const canGoNext = startIndex < recommendedBooks.length - itemsToShow;

  if (loading) return <div>Loading recommendations...</div>;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-card mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-subtle">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl text-gray-900">AI Recommendations</h2>
            <p className="text-sm text-gray-600">Based on your reading history</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="h-8 w-8 p-0 bg-white hover:bg-gray-50 disabled:opacity-30 transition-smooth"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
            className="h-8 w-8 p-0 bg-white hover:bg-gray-50 disabled:opacity-30 transition-smooth"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-lg p-4 shadow-subtle hover:shadow-card transition-smooth cursor-pointer"
            onClick={() => onBookClick?.(book.id)}
          >
            <div className="relative mb-3">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-subtle">
                <Sparkles className="w-3 h-3 inline mr-1" />
                AI Pick
              </div>
            </div>
            <h3 className="text-sm text-gray-900 mb-1 line-clamp-1">{book.title}</h3>
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{book.author}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600">Rs. {book.price}</span>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-xs text-gray-600">{book.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Powered by AI • Updated based on your preferences and browsing patterns
        </p>
      </div>
    </div>
  );
}