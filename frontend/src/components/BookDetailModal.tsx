import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Book } from './BookMarketplace';
import { Book as BookIcon, Calendar, FileText, Languages, Package, Star, MapPin, Navigation, ShoppingCart, MessageCircle, ArrowLeftRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { PurchaseConfirmation } from './PurchaseConfirmation';
import { ExchangeOfferModal } from './Exchange/ExchangeOfferModal';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const [showPurchase, setShowPurchase] = useState(false);
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New': return 'bg-green-100 text-green-800';
      case 'Like New': return 'bg-blue-100 text-blue-800';
      case 'Good': return 'bg-yellow-100 text-yellow-800';
      case 'Fair': return 'bg-orange-100 text-orange-800';
      case 'Poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddToCart = () => {
    addToCart(book);
    toast.success('Added to cart');
    onClose();
  };

  const handleContactSeller = () => {
    navigate('/chat', {
      state: {
        otherUser: {
          id: book.userId,
          name: book.seller.name,
          avatar: book.seller.avatar,
          online: false
        },
        bookContext: {
          id: book.id,
          title: book.title,
          price: book.price,
          image: book.images[0]
        }
      }
    });
    onClose();
  };

  const handleNegotiate = () => {
    setShowNegotiate(true);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="relative h-64 md:h-80 bg-gray-100">
          <ImageWithFallback
            src={book.images[0]}
            alt={book.title}
            className="w-full h-full object-contain mix-blend-multiply p-4"
          />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium shadow-sm">
            {book.type === 'rent' ? 'For Rent' : book.type === 'exchange' ? 'For Exchange' : book.type === 'both' ? 'Sell, Rent & Exchange' : 'For Sale'}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">{book.title}</h2>
              <p className="text-lg text-gray-600">{book.author}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#C4A672]">${book.price}</div>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(book.condition)}`}>
                {book.condition}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            {/* Left Column: Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-[#2C3E50] font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{book.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">ISBN</span>
                  <span className="text-sm font-medium">{book.isbn}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Published</span>
                  <span className="text-sm font-medium">{book.publishedYear}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Language</span>
                  <span className="text-sm font-medium">{book.language}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Pages</span>
                  <span className="text-sm font-medium">{book.pages}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Seller & Actions */}
            <div className="space-y-6">
              <div>
                <h3 className="text-[#2C3E50] mb-3">Seller Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {book.seller.avatar ? <img src={book.seller.avatar} alt={book.seller.name} className="w-full h-full rounded-full object-cover" /> : book.seller.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-[#2C3E50]">{book.seller.name}</div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      {book.seller.rating} • {book.seller.totalSales} sales
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Mock */}
              <div>
                <h3 className="text-[#2C3E50] mb-3">Location & Delivery</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-[#C4A672]" />
                    <span className="text-gray-700">Available for local pickup and shipping</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button onClick={handleAddToCart} className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleNegotiate} variant="outline" className="h-11 border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672] hover:text-white">
                    Negotiate Price
                  </Button>

                  {(book.type === 'exchange' || book.type === 'both') ? (
                    <Button onClick={() => setShowExchangeModal(true)} variant="outline" className="h-11 border-blue-500 text-blue-600 hover:bg-blue-50">
                      <ArrowLeftRight className="w-4 h-4 mr-2" />
                      Exchange
                    </Button>
                  ) : (
                    <Button onClick={handleContactSeller} variant="outline" className="h-11 border-gray-300 hover:bg-gray-50">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                  )}
                </div>

                {(book.type === 'exchange' || book.type === 'both') && (
                  <Button onClick={handleContactSeller} variant="outline" className="w-full h-11 border-gray-300 hover:bg-gray-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Seller
                  </Button>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1"><Package className="w-4 h-4" /><span>Secure Shipping</span></div>
                <div className="flex items-center gap-1"><Star className="w-4 h-4" /><span>Verified Sellers</span></div>
              </div>
            </div>
          </div>
        </div>

        {showNegotiate && (
          <NegotiateDialog book={book} onClose={() => setShowNegotiate(false)} />
        )}

        {showExchangeModal && (
          <ExchangeOfferModal
            requestedBook={book}
            isOpen={showExchangeModal}
            onClose={() => setShowExchangeModal(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NegotiateDialog({ book, onClose }: { book: Book; onClose: () => void }) {
  const [offerPrice, setOfferPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!offerPrice) return;
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please log in to negotiate');
        return;
      }

      await addDoc(collection(db, 'negotiations'), {
        buyerId: user.uid,
        buyerName: user.displayName || 'Anonymous',
        bookId: book.id,
        bookTitle: book.title,
        sellerName: book.seller.name,
        offerPrice: parseFloat(offerPrice),
        message: message,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast.success('Offer sent to seller!');
      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('Failed to send offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-[#2C3E50] mb-4">Negotiate Price</h3>
        <p className="text-gray-600 text-sm mb-4">Current asking price: ${book.price.toFixed(2)}</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700 block mb-2">Your Offer</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A672] focus:border-[#C4A672]"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-2">Message (Optional)</label>
            <textarea
              rows={3}
              placeholder="Add a message to the seller..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A672] focus:border-[#C4A672]"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!offerPrice || isSubmitting} className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white">
              {isSubmitting ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}