import { useState } from 'react';
import { Heart, ShoppingCart, X, Trash2, ArrowLeft, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../context/CartContext';

interface WishlistPageProps {
  onBack: () => void;
  onNavigateToMarketplace: () => void;
  onNavigateToBook?: (bookId: string) => void;
}

export function WishlistPage({ onBack, onNavigateToMarketplace, onNavigateToBook }: WishlistPageProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const { wishlist, loading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const buyWishlist = wishlist.filter(item => item.type === 'buy');
  const rentWishlist = wishlist.filter(item => item.type === 'rent');

  const recommendations = [
    {
      id: 'r1',
      title: 'Lord of the Rings',
      author: 'J.R.R. Tolkien',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400&q=80',
      reason: 'Because you liked The Hobbit'
    },
    {
      id: 'r2',
      title: 'Foundation',
      author: 'Isaac Asimov',
      price: 15.99,
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
      reason: 'Similar to Dune'
    },
  ];

  const handleRemoveFromWishlist = (item: any) => {
    toggleWishlist({ id: item.bookId });
  };

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

  const currentWishlist = activeTab === 'buy' ? buyWishlist : rentWishlist;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C4A672]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F3] to-white pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-[#C4A672] shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <button
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
              onClick={onNavigateToMarketplace}
              variant="outline"
              className="border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white"
            >
              Browse Books
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'buy' | 'rent')} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="buy" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Buy ({buyWishlist.length})
            </TabsTrigger>
            <TabsTrigger value="rent" className="data-[state=active]:bg-[#C4A672] data-[state=active]:text-white">
              Rent ({rentWishlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="mt-8">
            {buyWishlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buyWishlist.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-56 object-cover"
                      />
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-lg">
                            Not Available
                          </Badge>
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveFromWishlist(item)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#2C3E50] mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#C4A672] text-xl">
                          {item.type === 'buy' ? `$${item.price.toFixed(2)}` : `$${item.price.toFixed(2)}/${item.rentDuration || 'term'}`}
                        </span>
                        <Badge variant="outline">{item.condition}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Added {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recently'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onNavigateToBook?.(item.bookId)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {item.available && (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Buy Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Heart className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-[#2C3E50] text-xl mb-2">No books in your buy wishlist</h3>
                <p className="text-gray-500 mb-6">Start adding books you want to purchase</p>
                <Button
                  onClick={onNavigateToMarketplace}
                  className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                >
                  Browse Books
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rent" className="mt-8">
            {rentWishlist.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rentWishlist.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title}
                        className="w-full h-56 object-cover"
                      />
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Badge variant="destructive" className="text-lg">
                            Not Available
                          </Badge>
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveFromWishlist(item)}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow-md"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[#2C3E50] mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[#C4A672] text-xl">${item.price.toFixed(2)}/{item.rentDuration || 'term'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Added {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recently'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onNavigateToBook?.(item.bookId)}
                          variant="outline"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {item.available && (
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
                          >
                            Rent Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Heart className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-[#2C3E50] text-xl mb-2">No books in your rent wishlist</h3>
                <p className="text-gray-500 mb-6">Start adding books you want to rent</p>
                <Button
                  onClick={onNavigateToMarketplace}
                  className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                >
                  Browse Books
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recommendations Section */}
        {currentWishlist.length > 0 && (
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
                      <span className="text-[#C4A672] text-lg">${book.price}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600"
                      >
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
