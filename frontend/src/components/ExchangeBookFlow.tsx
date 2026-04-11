

// src/components/ExchangeBookFlow.tsx
import { useState, useEffect } from 'react';
import { BookDetailsStep } from './SellBook/BookDetailsStep';
import { LocationStep } from './SellBook/LocationStep';
import { ReviewStep } from './SellBook/ReviewStep';
import { SuccessStep } from './SellBook/SuccessStep';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { BookFormData, LocationData } from './SellBookFlow'; // Reuse types
import { Button } from './ui/button';
import { BookCard } from './BookCard';
import { Book } from './BookMarketplace';
import { useNavigate } from 'react-router-dom';

interface ExchangeBookFlowProps {
    onClose: () => void;
}

function ExchangeBookWizard({ onClose }: { onClose: () => void }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [bookData, setBookData] = useState<BookFormData>({
        isbn: '',
        bookName: '',
        author: '',
        price: '0', // Not used for exchange, but required by type
        condition: 'Good',
        category: 'Fiction',
        description: '',
        publishedYear: '',
        language: 'English',
        pages: '',
        images: [],
        imageFiles: [],
        exchangePreferences: ''
    });

    const [locationData, setLocationData] = useState<LocationData>({
        method: 'both',
        address: '',
        city: '',
        state: '',
        zipCode: ''
    });

    const handleBookDetailsNext = (data: BookFormData) => {
        setBookData(data);
        setCurrentStep(2);
    };

    const handleLocationNext = (data: LocationData) => {
        setLocationData(data);
        setCurrentStep(3);
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast.error('Please login to submit listing');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Sanitize Location Data
            const cleanLocation = Object.fromEntries(
                Object.entries(locationData).filter(([_, v]) => v !== undefined)
            );

            if (locationData.coordinates) {
                cleanLocation.coordinates = {
                    lat: Number(locationData.coordinates.lat),
                    lng: Number(locationData.coordinates.lng)
                };
            }

            // 2. Validate Numeric Data
            const pages = parseInt(bookData.pages);
            const publishedYear = parseInt(bookData.publishedYear);

            // 3. Upload Images to Firebase Storage
            const imageUrls: string[] = [];
            if (bookData.imageFiles && bookData.imageFiles.length > 0) {
                for (const file of bookData.imageFiles) {
                    try {
                        const uniqueFilename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                        const storageRef = ref(storage, `book_images/${user.uid}/${uniqueFilename}`);
                        
                        await uploadBytes(storageRef, file);
                        const downloadURL = await getDownloadURL(storageRef);
                        imageUrls.push(downloadURL);
                    } catch (uploadErr) {
                        console.error("Error uploading file:", file.name, uploadErr);
                        toast.error(`Failed to upload ${file.name}`);
                    }
                }
            }

            if (imageUrls.length === 0) {
                throw new Error('Could not upload book photos. Check your connection and try again.');
            }

            const listingData = {
                ...bookData,
                title: bookData.bookName,
                price: 0, // Exchange items have 0 price
                pages: isNaN(pages) ? 0 : pages,
                publishedYear: isNaN(publishedYear) ? 0 : publishedYear,
                location: cleanLocation,
                userId: user.uid,
                seller: {
                    name: user.displayName || 'Anonymous',
                    rating: 0, // Default for new seller
                    totalSales: 0,
                    avatar: user.photoURL || ''
                },
                images: imageUrls,
                type: 'exchange', // Explicitly 'exchange'
                availableFor: ['exchange'],
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // Remove imageFiles from listingData before saving to Firestore
            delete (listingData as any).imageFiles;
            delete (listingData as any).bookName;

            // 4. Submit to Firestore
            await addDoc(collection(db, 'books'), listingData);

            toast.success('Exchange listing created successfully!');
            setCurrentStep(4);
        } catch (err: any) {
            console.error('Failed to submit listing:', err);
            toast.error(err.message || 'Failed to create listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (step: number) => {
        setCurrentStep(step);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative my-8">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white text-2xl">Exchange Your Book</h2>
                        <p className="text-white/90 text-sm mt-1">
                            {currentStep === 1 && 'Step 1 of 3: Book Details'}
                            {currentStep === 2 && 'Step 2 of 3: Location & Delivery'}
                            {currentStep === 3 && 'Step 3 of 3: Review & Confirm'}
                            {currentStep === 4 && 'Listing Created!'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                {currentStep < 4 && (
                    <div className="px-6 py-4 bg-gray-50">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex-1">
                                    <div
                                        className={`h-2 rounded-full transition-colors ${step <= currentStep
                                            ? 'bg-[#C4A672]'
                                            : 'bg-gray-200'
                                            }`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {currentStep === 1 && (
                        <BookDetailsStep
                            initialData={bookData}
                            onNext={handleBookDetailsNext}
                            onCancel={onClose}
                            isExchange={true}
                        />
                    )}
                    {currentStep === 2 && (
                        <LocationStep
                            initialData={locationData}
                            onNext={handleLocationNext}
                            onBack={handleBack}
                        />
                    )}
                    {currentStep === 3 && (
                        <ReviewStep
                            bookData={bookData}
                            locationData={locationData}
                            onSubmit={handleSubmit}
                            onBack={handleBack}
                            onEdit={handleEdit}
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {currentStep === 4 && (
                        <SuccessStep
                            onClose={onClose}
                            onAddAnother={() => {
                                setCurrentStep(1);
                                setBookData({
                                    isbn: '',
                                    bookName: '',
                                    author: '',
                                    price: '0',
                                    condition: 'Good',
                                    category: 'Fiction',
                                    description: '',
                                    publishedYear: '',
                                    language: 'English',
                                    pages: '',
                                    images: [],
                                    exchangePreferences: ''
                                });
                                setLocationData({
                                    method: 'both',
                                    address: '',
                                    city: '',
                                    state: '',
                                    zipCode: ''
                                });
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function isExchangeListingVisible(book: Book): boolean {
    if (book.isSold === true) return false;
    if (book.listingStatus === 'sold') return false;
    if (book.listingStatus === 'reserved') return false;
    if (book.status != null && book.status !== '' && book.status !== 'active') return false;
    return true;
}

export function ExchangeBookFlow({ onClose }: ExchangeBookFlowProps) {
    const navigate = useNavigate();
    const [showWizard, setShowWizard] = useState(false);
    const [exchangeListings, setExchangeListings] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchListings = async () => {
            try {
                const q = query(
                    collection(db, 'books'),
                    where('availableFor', 'array-contains', 'exchange')
                );
                const snapshot = await getDocs(q);
                const books = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() } as Book))
                    .filter(isExchangeListingVisible);
                setExchangeListings(books);
            } catch (error) {
                console.error('Error fetching exchange listings:', error);
            } finally {
                setLoading(false);
            }
        };

        if (!showWizard) {
            fetchListings();
        }
    }, [showWizard]);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="-ml-2">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-[#2C3E50]">Book Exchange</h1>
                            <p className="text-gray-600">Browse listings open for trade and add your own</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowWizard(true)}
                        className="bg-[#C4A672] hover:bg-[#8B7355] text-white transition-smooth btn-scale"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Book for Exchange
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">Loading listings...</div>
                ) : exchangeListings.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {exchangeListings.map((book) => (
                            <div key={book.id} className="relative group">
                                <BookCard book={book} onClick={() => navigate(`/book/${book.id}`)} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No exchange listings found</h3>
                        <p className="text-gray-500 mb-6">Start a trade by listing a book you'd like to exchange.</p>
                        <Button
                            onClick={() => setShowWizard(true)}
                            className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                        >
                            List Book for Exchange
                        </Button>
                    </div>
                )}
            </div>

            {showWizard && (
                <ExchangeBookWizard onClose={() => setShowWizard(false)} />
            )}
        </div>
    );
}
