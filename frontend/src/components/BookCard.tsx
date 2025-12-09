// Updated src/components/BookCard.tsx
import { Book } from './BookMarketplace';
import { Star, User, Tag, Calendar, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleAuthCheck } from '../utils/auth';

interface BookCardProps {
  book: Book;
  onClick: () => void;
}

export function BookCard({ book, onClick }: BookCardProps) {
  const { addToCart } = useCart();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!handleAuthCheck(user, navigate, location.pathname)) return;

    addToCart({
      id: book.id,
      title: book.title,
      price: book.price,
      image: book.images?.[0] || '',
      type: book.type === 'rent' ? 'rent' : 'buy',
      sellerName: book.seller?.name || 'Unknown',
      sellerId: book.userId || 'unknown' // Book type in marketplace might not have sellerId at top level, keeping safe
    });
  };
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

  const getTypeBadge = (book: Book) => {
    const badges = [];
    if (book.availableFor?.includes('sale')) {
      badges.push(<Badge key="sale" className="bg-blue-100 text-blue-800 absolute top-2 right-2">For Sale</Badge>);
    }
    if (book.availableFor?.includes('rent')) {
      badges.push(<Badge key="rent" className="bg-purple-100 text-purple-800 absolute top-2 right-20">Rent</Badge>); // Adjust positioning if needed or stack them
    }
    if (book.availableFor?.includes('exchange')) {
      badges.push(<Badge key="exchange" className="bg-orange-100 text-orange-800 absolute top-2 right-2">Exchange</Badge>);
    }

    // Fallback if availableFor is not set but type is
    if (!book.availableFor || book.availableFor.length === 0) {
      if (book.type === 'sell') return <Badge className="bg-blue-100 text-blue-800 absolute top-2 right-2">For Sale</Badge>;
      if (book.type === 'rent') return <Badge className="bg-purple-100 text-purple-800 absolute top-2 right-2">For Rent</Badge>;
      if (book.type === 'exchange') return <Badge className="bg-orange-100 text-orange-800 absolute top-2 right-2">Exchange</Badge>;
    }

    // For now, let's just show the primary one or stack them properly? 
    // Simplified: Just show primary badge based on priority or a simplified "Multiple" badge?
    // Let's stack them horizontally or just show the most relevant one for now to avoid UI clutter
    if (book.availableFor?.includes('sale')) return <Badge className="bg-blue-100 text-blue-800 absolute top-2 right-2">For Sale</Badge>;
    if (book.availableFor?.includes('rent')) return <Badge className="bg-purple-100 text-purple-800 absolute top-2 right-2">For Rent</Badge>;
    if (book.availableFor?.includes('exchange')) return <Badge className="bg-orange-100 text-orange-800 absolute top-2 right-2">Exchange</Badge>;

    return null;
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
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {book.availableFor?.includes('sale') && <Badge className="bg-blue-100 text-blue-800 shadow-sm">Sale</Badge>}
          {book.availableFor?.includes('rent') && <Badge className="bg-purple-100 text-purple-800 shadow-sm">Rent</Badge>}
          {book.availableFor?.includes('exchange') && <Badge className="bg-orange-100 text-orange-800 shadow-sm">Exchange</Badge>}

          {/* Fallback */}
          {(!book.availableFor || book.availableFor.length === 0) && (
            book.type === 'sell' ? <Badge className="bg-blue-100 text-blue-800 shadow-sm">Sale</Badge> :
              book.type === 'rent' ? <Badge className="bg-purple-100 text-purple-800 shadow-sm">Rent</Badge> :
                book.type === 'exchange' ? <Badge className="bg-orange-100 text-orange-800 shadow-sm">Exchange</Badge> : null
          )}
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
            <div className="flex items-center gap-2">
              <span className="text-[#C4A672] text-xl font-bold">
                {book.availableFor?.includes('sale') ? `Rs. ${book.price.toLocaleString()}` :
                  book.availableFor?.includes('rent') ? `Rs. ${book.rentPrice || '?'}/term` :
                    'Exchange Only'}
              </span>
            </div>
            {book.availableFor?.includes('sale') && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 text-[#C4A672]" />
              </Button>
            )}
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