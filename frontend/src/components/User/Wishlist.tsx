// Updated src/components/User/Wishlist.tsx
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Heart, ShoppingCart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWishlist, wishlistItemKind, WishlistItem } from '../../hooks/useWishlist';
import { useCart } from '../../context/CartContext';

type WishlistTab = 'all' | 'buy' | 'rent' | 'exchange';

interface WishlistProps {
  onNavigateToMarketplace: (options?: {
    pickForWishlist?: boolean;
    wishlistType?: 'buy' | 'rent' | 'exchange';
  }) => void;
}

export function Wishlist({ onNavigateToMarketplace }: WishlistProps) {
  const navigate = useNavigate();
  const { wishlist, loading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const buyWishlist = wishlist.filter((item) => wishlistItemKind(item) === 'buy');
  const rentWishlist = wishlist.filter((item) => wishlistItemKind(item) === 'rent');
  const exchangeWishlist = wishlist.filter((item) => wishlistItemKind(item) === 'exchange');

  const tabItems: Record<WishlistTab, WishlistItem[]> = {
    all: wishlist,
    buy: buyWishlist,
    rent: rentWishlist,
    exchange: exchangeWishlist,
  };

  const handleAddToCart = (item: WishlistItem) => {
    if (wishlistItemKind(item) === 'exchange') return;
    addToCart({
      id: item.bookId,
      title: item.title,
      price: item.price,
      image: item.image,
      type: item.type === 'rent' ? 'rent' : 'buy',
      sellerName: 'Unknown',
      sellerId: 'unknown',
    });
  };

  const handleRemove = (item: WishlistItem) => {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              My Wishlist
            </h3>
            <p className="text-gray-600 text-sm">Buy, rent, and exchange — filter with tabs below</p>
          </div>
          <Button
            onClick={() =>
              onNavigateToMarketplace({ pickForWishlist: true, wishlistType: 'buy' })
            }
            variant="outline"
          >
            Add more books
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1 mb-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              All ({wishlist.length})
            </TabsTrigger>
            <TabsTrigger value="buy" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Buy ({buyWishlist.length})
            </TabsTrigger>
            <TabsTrigger value="rent" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Rent ({rentWishlist.length})
            </TabsTrigger>
            <TabsTrigger
              value="exchange"
              className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white"
            >
              Exchange ({exchangeWishlist.length})
            </TabsTrigger>
          </TabsList>

          {(['all', 'buy', 'rent', 'exchange'] as WishlistTab[]).map((tab) => (
            <TabsContent key={tab} value={tab}>
              {tabItems[tab].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tabItems[tab].map((item) => {
                    const kind = wishlistItemKind(item);
                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {kind === 'buy' ? 'Buy' : kind === 'rent' ? 'Rent' : 'Exchange'}
                              </Badge>
                            </div>
                            <h4 className="text-[#2C3E50]">{item.title}</h4>
                            <p className="text-sm text-gray-600">by {item.author}</p>
                            <p className="text-[#C4A672] text-lg mt-2">
                              {kind === 'buy' && `Rs. ${item.price.toFixed(2)}`}
                              {kind === 'rent' && `Rs. ${item.price.toFixed(2)}/term`}
                              {kind === 'exchange' && 'Exchange listing'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemove(item)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate(`/book/${item.bookId}`)}
                          >
                            View listing
                          </Button>
                          {kind !== 'exchange' && item.available && (
                            <Button
                              type="button"
                              onClick={() => handleAddToCart(item)}
                              className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {kind === 'rent' ? 'Rent Now' : 'Add to Cart'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">
                    {tab === 'all'
                      ? 'Your wishlist is empty'
                      : tab === 'exchange'
                        ? 'No exchange wishlist items yet'
                        : `No ${tab} wishlist items yet`}
                  </p>
                  <Button
                    onClick={() =>
                      onNavigateToMarketplace({
                        pickForWishlist: true,
                        wishlistType: tab === 'rent' ? 'rent' : tab === 'exchange' ? 'exchange' : 'buy',
                      })
                    }
                    className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  >
                    Add more books
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
