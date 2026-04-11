// src/components/AIRecommendations.tsx
import { Sparkles, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Button } from './ui/button';
import { auth, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';

interface Recommendation {
  id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  relevance: string;
  difficulty: string;
  bloom_score: number;
}

interface AIRecommendationsProps {
  context?: 'home' | 'search' | 'book-detail';
  onBookClick?: (bookId: string) => void;
}

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  'Advanced Science': 'bg-red-100 text-red-700',
};

const genreColor: Record<string, string> = {
  'Hard Science Fiction': 'bg-indigo-100 text-indigo-700',
  'Speculative Non-Fiction': 'bg-amber-100 text-amber-700',
  'Classic Sci-Fi': 'bg-purple-100 text-purple-700',
};

export function AIRecommendations({ context = 'home', onBookClick }: AIRecommendationsProps) {
  const [user] = useAuthState(auth);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const itemsToShow = 3;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const getAntigravityRecommendations = httpsCallable<void, { recommendations: Recommendation[] }>(
          functions,
          'getAntigravityRecommendations'
        );
        const result = await getAntigravityRecommendations();
        setRecommendations(result.data.recommendations ?? []);
        setStartIndex(0);
      } catch (err) {
        toast.error('Failed to fetch AI recommendations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [user?.uid]);

  const handlePrevious = () => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setStartIndex((prev) => Math.min(recommendations.length - itemsToShow, prev + 1));
  };

  const visibleBooks = recommendations.slice(startIndex, startIndex + itemsToShow);
  const canGoPrevious = startIndex > 0;
  const canGoNext = startIndex < recommendations.length - itemsToShow;

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-card mb-8 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-200 rounded-lg" />
          <div className="h-6 w-48 bg-blue-200 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-5 h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-card mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-subtle">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl text-gray-900">Book recommendations</h2>
            <p className="text-sm text-gray-600">
              {user
                ? 'Based on your wishlist and BookBloom activity'
                : 'Live picks from the marketplace — sign in to personalize'}
            </p>
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

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-lg p-5 shadow-subtle hover:shadow-card transition-smooth cursor-pointer flex flex-col"
            onClick={() => onBookClick?.(book.id)}
          >
            {/* Genre + Difficulty badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${genreColor[book.genre] || 'bg-gray-100 text-gray-700'}`}>
                {book.genre}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColor[book.difficulty] || 'bg-gray-100 text-gray-700'}`}>
                {book.difficulty}
              </span>
            </div>

            {/* Title & Author */}
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-2">{book.title}</h3>
            <p className="text-xs text-gray-500 mb-2">by {book.author}</p>

            {/* Summary */}
            <p className="text-xs text-gray-600 mb-3 line-clamp-3 flex-1">{book.summary}</p>

            {/* Bloom Score bar */}
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Bloom Score
                </span>
                <span className="text-xs font-bold text-blue-600">{book.bloom_score}/100</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${book.bloom_score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Book recommendations • Uses your wishlist and purchase, rental, and sales history when signed in
        </p>
      </div>
    </div>
  );
}