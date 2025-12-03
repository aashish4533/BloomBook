// Updated src/components/BookDetailsPage.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Book as BookIcon, Calendar, FileText, Languages, Package, Star, MapPin, Navigation, ShoppingCart, MessageCircle, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { PurchaseConfirmation } from './PurchaseConfirmation';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Book } from './BookMarketplace';
import { useDocument } from 'react-firebase-hooks/firestore';

export function BookDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [value, loading, error] = useDocument(
        id ? doc(db, 'books', id) : null,
        {
            snapshotListenOptions: { includeMetadataChanges: true },
        }
    );

    const [showPurchase, setShowPurchase] = useState(false);
    const [showNegotiate, setShowNegotiate] = useState(false);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading book details...</div>;
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error.message}</div>;
    }

    if (!value || !value.exists()) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-800">Book not found</h2>
                <Button onClick={() => navigate('/marketplace')} className="mt-4">
                    Back to Marketplace
                </Button>
            </div>
        );
    }

    const book = { id: value.id, ...value.data() } as Book;

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

    const handleBuyNow = () => {
        console.log('Buying book:', book.id);
        setShowPurchase(true);
    };

    const handleContactSeller = () => {
        if (!auth.currentUser) {
            toast.error('Please log in to contact the seller');
            navigate('/login');
            return;
        }

        if (auth.currentUser.uid === book.seller.id) { // Assuming book.seller has an id, if not we might need to fetch it or store it on the book object
            toast.error("You cannot chat with yourself");
            return;
        }

        // We need the seller's ID. The current Book interface in BookMarketplace.tsx has seller: { name, rating, ... } but maybe not ID.
        // Let's check the Book interface again or assume we need to add sellerId to the book document.
        // Looking at SellBookFlow, we added `userId` to the book document. 
        // So `book.userId` should be the seller's ID.

        navigate('/chat', {
            state: {
                otherUser: {
                    id: book.userId, // Use book.userId as seller ID
                    name: book.seller.name,
                    avatar: book.seller.avatar || 'S',
                    online: false // We don't track online status yet
                },
                bookContext: {
                    id: book.id,
                    title: book.title,
                    price: book.price,
                    image: book.images?.[0]
                }
            }
        });
    };

    const handleNegotiate = () => {
        setShowNegotiate(true);
    };

    if (showPurchase) {
        return <PurchaseConfirmation book={book} onClose={() => setShowPurchase(false)} onBack={() => setShowPurchase(false)} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-6 sm:p-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2 text-gray-600">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column - Image */}
                    <div className="space-y-4">
                        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                            <ImageWithFallback
                                src={book.images && book.images.length > 0 ? book.images[0] : ''}
                                alt={book.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#2C3E50] mb-2">{book.title}</h1>
                            <p className="text-gray-600 text-lg">by {book.author}</p>
                        </div>

                        {/* Price and Condition */}
                        <div className="flex items-center gap-4">
                            <div className="text-4xl text-[#C4A672]">${book.price.toFixed(2)}</div>
                            <Badge className={`${getConditionColor(book.condition)} text-sm px-3 py-1`}>
                                {book.condition}
                            </Badge>
                        </div>

                        {/* Book Details */}
                        <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-3 text-sm">
                                <BookIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Category:</span>
                                <span className="text-[#2C3E50]">{book.category}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Published:</span>
                                <span className="text-[#2C3E50]">{book.publishedYear}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Pages:</span>
                                <span className="text-[#2C3E50]">{book.pages}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Languages className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Language:</span>
                                <span className="text-[#2C3E50]">{book.language}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">ISBN:</span>
                                <span className="text-[#2C3E50] text-xs">{book.isbn}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-[#2C3E50] font-semibold mb-2">Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{book.description}</p>
                        </div>

                        <Separator />

                        {/* Seller Info */}
                        <div>
                            <h3 className="text-[#2C3E50] font-semibold mb-3">Seller Information</h3>
                            <div className="flex items-start gap-4 bg-gray-50 rounded-lg p-4">
                                <Avatar className="w-12 h-12 bg-[#C4A672] text-white">
                                    <AvatarFallback>{book.seller.name ? book.seller.name.charAt(0) : 'S'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-[#2C3E50] font-medium">{book.seller.name}</p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm text-gray-600">{book.seller.rating} rating</span>
                                        </div>
                                        <span className="text-sm text-gray-600">{book.seller.totalSales} sales</span>
                                    </div>
                                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <span>San Francisco, CA (15 miles away)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location & Delivery */}
                        <div>
                            <h3 className="text-[#2C3E50] font-semibold mb-3">Location & Delivery</h3>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="w-4 h-4 text-[#C4A672]" />
                                    <span className="text-gray-700">Available for local pickup and shipping</span>
                                </div>
                                <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm">Map View</p>
                                        <p className="text-xs mt-1">San Francisco, CA</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => alert('This would open directions to the pickup location')}
                                >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    Get Directions
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4">
                            <Button
                                onClick={handleBuyNow}
                                className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Buy Now
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    onClick={handleNegotiate}
                                    variant="outline"
                                    className="h-11 border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672] hover:text-white"
                                >
                                    Negotiate Price
                                </Button>
                                <Button
                                    onClick={handleContactSeller}
                                    variant="outline"
                                    className="h-11 border-gray-300 hover:bg-gray-50"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Contact
                                </Button>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center justify-center gap-4 pt-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                <span>Secure Shipping</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                <span>Verified Sellers</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Negotiate Price Dialog */}
                {showNegotiate && (
                    <NegotiateDialog
                        book={book}
                        onClose={() => setShowNegotiate(false)}
                    />
                )}
            </div>
        </div>
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
                sellerName: book.seller.name, // In real app, use sellerId
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
                <p className="text-gray-600 text-sm mb-4">
                    Current asking price: ${book.price.toFixed(2)}
                </p>
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
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!offerPrice || isSubmitting}
                            className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Offer'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
