// Updated src/components/Home/FeaturedBooks.tsx
import { useState, useEffect } from 'react';
import { BookOpen, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { db } from '../../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  condition: string;
  image: string;
  type: 'buy' | 'sell' | 'rent';
  rentalPrice?: {
    weekly?: number;
    monthly?: number;
    yearly?: number;
  };
}

interface FeaturedBooksProps {
  activeTab: 'buy' | 'sell' | 'rent';
  onNavigateToBook: (bookId: string) => void;
  onExplore?: () => void;
}

export function FeaturedBooks({ activeTab, onNavigateToBook, onExplore }: FeaturedBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      const q = query(collection(db, 'books'), where('type', '==', activeTab), limit(4));  // Featured: top 4
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(data);
    };
    fetchBooks();
  }, [activeTab]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {books.map((book) => (
        <div
          key={book.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => onNavigateToBook(book.id)}
        >
          {/* Book Image */}
          <div className="relative h-64 bg-gray-100 overflow-hidden">
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <Badge className="absolute top-3 right-3 bg-[#C4A672] text-white border-0">
              {book.condition}
            </Badge>
          </div>

          {/* Book Info */}
          <div className="p-4">
            <h3 className="text-[#2C3E50] mb-1 line-clamp-1 group-hover:text-[#C4A672] transition-colors">
              {book.title}
            </h3>
            <p className="text-gray-600 text-sm mb-3">{book.author}</p>

            {/* Price */}
            <div className="flex items-center justify-between">
              {activeTab === 'rent' && book.rentalPrice ? (
                <div className="flex flex-col">
                  <span className="text-[#C4A672] text-xl">
                    ${book.rentalPrice.monthly}/mo
                  </span>
                  <span className="text-gray-500 text-xs">
                    ${book.rentalPrice.weekly}/wk
                  </span>
                </div>
              ) : (
                <span className="text-[#C4A672] text-2xl">
                  ${book.price}
                </span>
              )}

              <Button
                size="sm"
                className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
              >
                {activeTab === 'buy' && 'View'}
                {activeTab === 'sell' && 'List'}
                {activeTab === 'rent' && 'Rent'}
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* View All Card */}
      <div
        onClick={onExplore}
        className="bg-gradient-to-br from-[#C4A672] to-[#8B7355] rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-center min-h-[320px] group"
      >
        <div className="text-center text-white p-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
            {activeTab === 'buy' && <BookOpen className="w-8 h-8" />}
            {activeTab === 'sell' && <DollarSign className="w-8 h-8" />}
            {activeTab === 'rent' && <Calendar className="w-8 h-8" />}
          </div>
          <h3 className="text-xl mb-2">Browse All</h3>
          <p className="text-white/90 mb-4">
            Explore {activeTab === 'buy' ? 'thousands of' : 'all'} books
          </p>
          <div className="text-white/90 group-hover:text-white transition-colors">
            View More →
          </div>
        </div>
      </div>
    </div>
  );
}