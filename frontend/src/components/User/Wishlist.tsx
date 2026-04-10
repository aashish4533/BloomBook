// Updated src/components/User/Wishlist.tsx
import { Button } from '../ui/button';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useWishlist } from '../../hooks/useWishlist';
import { useCart } from '../../context/CartContext';

interface WishlistProps {
  onNavigateToMarketplace: () => void;
}

export function Wishlist({ onNavigateToMarketplace }: WishlistProps) {
  const { wishlist, loading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart({
      id: item.bookId,
      title: item.title,
      price: item.price,
      image: item.image,
      type: item.type,
      sellerName: 'Unknown',
      sellerId: 'unknown'
    });
  };

  const handleRemove = (item: any) => {
    toggleWishlist({ id: item.bookId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C4A672]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              My Wishlist
            </h3>
            <p className="text-gray-600 text-sm">Books you want to read</p>
          </div>
          <Button onClick={onNavigateToMarketplace} variant="outline">
            Browse More Books
          </Button>
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wishlist.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-[#2C3E50]">{item.title}</h4>
                    <p className="text-sm text-gray-600">by {item.author}</p>
                    <p className="text-[#C4A672] text-lg mt-2">
                      {item.type === 'rent' ? `Rs. ${item.price.toFixed(2)}/term` : `Rs. ${item.price.toFixed(2)}`}
                    </p>
                  </div>
                  <button onClick={() => handleRemove(item)} className="text-gray-400 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {item.available && (
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {item.type === 'rent' ? 'Rent Now' : 'Add to Cart'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">Your wishlist is empty</p>
            <Button onClick={onNavigateToMarketplace} className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
              Start Adding Books
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}