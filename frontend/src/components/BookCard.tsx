// Updated src/components/BookCard.tsx
import { Book } from './BookMarketplace';
import { Star, User, Tag, Calendar } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
      case 'Like New':
        return 'bg-green-100 text-green-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'Poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'sell':
        return <Badge className="bg-blue-100 text-blue-800">For Sale</Badge>;
      case 'rent':
        return <Badge className="bg-purple-100 text-purple-800">For Rent</Badge>;
      case 'exchange':
        return <Badge className="bg-orange-100 text-orange-800">Exchange</Badge>;
      case 'both':
        return <Badge className="bg-teal-100 text-teal-800">Sale & Rent</Badge>;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
    >
      {/* Book Image */}
      <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
        <ImageWithFallback
          src={book.images && book.images.length > 0 ? book.images[0] : ''}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          {getTypeBadge(book.type)}
        </div>
      </div>

      {/* Book Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-[#2C3E50] line-clamp-1">{book.title}</h3>
          <p className="text-gray-600 text-sm mt-1">{book.author}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getConditionColor(book.condition)}>
            {book.condition}
          </Badge>
          <span className="text-xs text-gray-500">{book.category}</span>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#C4A672] text-xl">
              {book.type === 'exchange' ? 'Exchange' : `$${book.price.toFixed(2)}`}
            </span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#C4A672] flex items-center justify-center text-white text-xs">
              {book.seller?.avatar || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">{book.seller?.name || 'Unknown Seller'}</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{book.seller?.rating || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}