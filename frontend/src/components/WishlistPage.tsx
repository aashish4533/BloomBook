import { useState } from 'react';
import { Heart, ShoppingCart, X, ArrowLeft, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useWishlist, WishlistItem, wishlistItemKind } from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';

type WishlistTab = 'all' | 'buy' | 'rent' | 'exchange';

interface WishlistPageProps {
  onBack: () => void;
  onNavigateToMarketplace: (options?: {
    pickForWishlist?: boolean;
    wishlistType?: 'buy' | 'rent' | 'exchange';
  }) => void;
  onNavigateToBook?: (bookId: string) => void;
}

interface WishlistEntryCardProps {
  item: WishlistItem;
  onRemove: () => void;
  onView: () => void;
  onAddToCart: () => void;
}

function WishlistEntryCard({ item, onRemove, onView, onAddToCart }: WishlistEntryCardProps) {
  const kind = wishlistItemKind(item);
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-56 object-cover" />
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg">
              Not Available
            </Badge>
          </div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
        >
          <X className="w-4 h-4 text-red-500" />
        </button>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {kind === 'buy' ? 'Buy' : kind === 'rent' ? 'Rent' : 'Exchange'}
          </Badge>
          <Badge variant="outline">{item.condition}</Badge>
        </div>
        <h3 className="text-[#2C3E50] mb-1">{item.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#C4A672] text-xl">
            {kind === 'buy' && `Rs. ${item.price.toFixed(2)}`}
            {kind === 'rent' && `Rs. ${item.price.toFixed(2)}/${item.rentDuration || 'term'}`}
            {kind === 'exchange' && 'Exchange listing'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Added {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recently'}
        </p>
        <div className="flex gap-2">
          <Button onClick={onView} variant="outline" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          {kind === 'buy' && item.available && (
            <Button onClick={onAddToCart} className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          )}
          {kind === 'rent' && item.available && (
            <Button onClick={onAddToCart} className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Rent Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function WishlistPage({ onBack, onNavigateToMarketplace, onNavigateToBook }: WishlistPageProps) {
  const [activeTab, setActiveTab] = useState<WishlistTab>('all');
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

  const marketplacePickType = (): 'buy' | 'rent' | 'exchange' =>
    activeTab === 'all' ? 'buy' : activeTab;

  const recommendations = [
    {
      id: 'r1',
      title: 'Lord of the Rings',
      author: 'J.R.R. Tolkien',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80',
      reason: 'Because you liked The Hobbit',
    },
    {
      id: 'r2',
      title: 'Foundation',
      author: 'Isaac Asimov',
      price: 15.99,
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
      reason: 'Similar to Dune',
    },
  ];

  const handleRemoveFromWishlist = (item: WishlistItem) => {
    toggleWishlist({ id: item.bookId });
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

  const emptyCopy: Record<WishlistTab, { title: string; hint: string; pick: 'buy' | 'rent' | 'exchange' }> = {
    all: {
      title: 'Your wishlist is empty',
      hint: 'Save books to buy, rent, or exchange from the marketplace.',
      pick: 'buy',
    },
    buy: {
      title: 'No books in your buy wishlist',
      hint: 'Start adding books you want to purchase.',
      pick: 'buy',
    },
    rent: {
      title: 'No books in your rent wishlist',
      hint: 'Start adding books you want to rent.',
      pick: 'rent',
    },
    exchange: {
      title: 'No books in your exchange wishlist',
      hint: 'Save listings you want to swap for.',
      pick: 'exchange',
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C4A672]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-8">
      <div className="bg-[#C4A672] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-[#2C3E50] hover:text-[#1a252f]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-[#2C3E50] text-2xl flex items-center gap-2">
              <Heart className="w-7 h-7 text-red-500 fill-red-500" />
              My Wishlist
            </h1>
            <Button
              onClick={() =>
                onNavigateToMarketplace({
                  pickForWishlist: true,
                  wishlistType: marketplacePickType(),
                })
              }
              variant="outline"
              className="border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white"
            >
              Add more books
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as WishlistTab)} className="mb-8">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
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
            <TabsContent key={tab} value={tab} className="mt-8">
              {tabItems[tab].length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tabItems[tab].map((item) => (
                    <WishlistEntryCard
                      key={item.id}
                      item={item}
                      onRemove={() => handleRemoveFromWishlist(item)}
                      onView={() => onNavigateToBook?.(item.bookId)}
                      onAddToCart={() => handleAddToCart(item)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Heart className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-[#2C3E50] text-xl mb-2">{emptyCopy[tab].title}</h3>
                  <p className="text-gray-500 mb-6">{emptyCopy[tab].hint}</p>
                  <Button
                    onClick={() =>
                      onNavigateToMarketplace({
                        pickForWishlist: true,
                        wishlistType: emptyCopy[tab].pick,
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

        {wishlist.length > 0 && (
          <div className="mt-12">
            <h2 className="text-[#2C3E50] text-2xl mb-6">Recommended For You</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map((book) => (
                <Card
                  key={book.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onNavigateToBook?.(book.id)}
                >
                  <ImageWithFallback
                    src={book.image}
                    alt={book.title}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-[#2C3E50] mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                    <p className="text-xs text-gray-500 italic mb-2">{book.reason}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#C4A672] text-lg">Rs. {Number(book.price).toLocaleString()}</span>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                        <Heart className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
