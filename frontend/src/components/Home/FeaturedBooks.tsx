import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { BookCard } from '../BookCard';
import { Book } from '../BookMarketplace';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeaturedBooksProps {
  activeTab: 'buy' | 'sell' | 'rent';
  onNavigateToBook: (bookId: string) => void;
  onExplore?: () => void;
}

export function FeaturedBooks({ activeTab, onNavigateToBook, onExplore }: FeaturedBooksProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        setLoading(true);
        // Fetch any latest books (removing strict status filter)
        const q = query(
          collection(db, 'books'),
          limit(8)
        );
        const snapshot = await getDocs(q);
        const fetchedBooks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];
        setBooks(fetchedBooks);
      } catch (error) {
        console.error("🔥 FIREBASE FETCH ERROR (FeaturedBooks):", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBooks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C4A672]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {books.length > 0 ? (
        books.map(book => (
          <BookCard 
            key={book.id} 
            book={book} 
            onClick={() => {
              if (onNavigateToBook) {
                onNavigateToBook(book.id);
              } else {
                navigate(`/book/${book.id}`);
              }
            }} 
          />
        ))
      ) : (
        <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-[#2C3E50] mb-2">No Books Available</h3>
          <p>Check back later for new listings!</p>
        </div>
      )}
    </div>
  );
}