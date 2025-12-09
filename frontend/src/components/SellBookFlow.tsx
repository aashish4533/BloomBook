// src/components/SellBookFlow.tsx
import { useState, useEffect } from 'react';
import { BookDetailsStep } from './SellBook/BookDetailsStep';
import { LocationStep } from './SellBook/LocationStep';
import { ReviewStep } from './SellBook/ReviewStep';
import { SuccessStep } from './SellBook/SuccessStep';
import { X, Plus, ArrowLeft } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { BookCard } from './BookCard';
import { Book } from './BookMarketplace';

export interface BookFormData {
  isbn: string;
  bookName: string;
  author: string;
  price: string;
  originalPrice?: string;
  condition: string;
  category: string;
  description: string;
  publishedYear: string;
  language: string;
  pages: string;
  images: string[];
  imageFiles?: File[];
  exchangePreferences?: string;
}

export interface LocationData {
  method: 'pickup' | 'shipping' | 'both';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SellBookFlowProps {
  onClose: () => void;
}

function SellBookWizard({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ... (Keep existing state and handlers: bookData, locationData, handleBookDetailsNext, etc.)
  const [bookData, setBookData] = useState<BookFormData>({
    isbn: '',
    bookName: '',
    author: '',
    price: '',
    originalPrice: '',
    condition: 'Good',
    category: 'Fiction',
    description: '',
    publishedYear: '',
    language: 'English',
    pages: '',
    images: []
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
      const price = parseFloat(bookData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error("Invalid price. Please enter a valid number greater than 0.");
      }

      const originalPrice = bookData.originalPrice ? parseFloat(bookData.originalPrice) : 0;
      if (bookData.originalPrice && (isNaN(originalPrice) || originalPrice < 0)) {
        throw new Error("Invalid original price.");
      }

      const pages = parseInt(bookData.pages);
      const publishedYear = parseInt(bookData.publishedYear);

      // 3. Upload Images to Cloudinary
      const imageUrls: string[] = [];
      if (bookData.imageFiles && bookData.imageFiles.length > 0) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          console.error("Cloudinary credentials missing");
          toast.error("Configuration error: Cloudinary credentials missing");
          return;
        }

        for (const file of bookData.imageFiles) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error?.message || 'Image upload failed');
            }

            const data = await response.json();
            imageUrls.push(data.secure_url);
          } catch (uploadErr) {
            console.error("Error uploading file:", file.name, uploadErr);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      const listingData = {
        ...bookData,
        title: bookData.bookName, // Map bookName to title for DB consistency
        price: price,
        originalPrice: originalPrice > 0 ? originalPrice : undefined,
        pages: isNaN(pages) ? 0 : pages,
        publishedYear: isNaN(publishedYear) ? 0 : publishedYear,
        location: cleanLocation,
        userId: user.uid,
        seller: {
          name: user.displayName || 'Anonymous',
          rating: 0,
          totalSales: 0,
          avatar: user.photoURL || ''
        },
        images: imageUrls.length > 0 ? imageUrls : bookData.images,
        type: 'sell',
        availableFor: ['sale'], // Explicit availableFor
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      delete (listingData as any).imageFiles;
      delete (listingData as any).bookName; // Cleanup

      await addDoc(collection(db, 'books'), listingData);

      toast.success('Listing created successfully!');
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
            <h2 className="text-white text-2xl">Sell Your Book</h2>
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
                  price: '',
                  originalPrice: '',
                  condition: 'Good',
                  category: 'Fiction',
                  description: '',
                  publishedYear: '',
                  language: 'English',
                  pages: '',
                  images: []
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

export function SellBookFlow({ onClose }: SellBookFlowProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [userListings, setUserListings] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Listings
  useEffect(() => {
    const fetchListings = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'books'),
          where('userId', '==', user.uid),
          where('type', '==', 'sell')
        );
        const snapshot = await getDocs(q);
        const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        setUserListings(books);
      } catch (error) {
        console.error("Error fetching user listings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!showWizard) {
      fetchListings();
    }
  }, [showWizard]); // Refetch when closing wizard

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* List View */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="-ml-2">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[#2C3E50]">My Sell Listings</h1>
              <p className="text-gray-600">Prepare your books for their new homes</p>
            </div>
          </div>
          <Button
            onClick={() => setShowWizard(true)}
            className="bg-[#C4A672] hover:bg-[#8B7355] text-white transition-smooth btn-scale"
          >
            <Plus className="w-5 h-5 mr-2" />
            Sell a Book
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">Loading listings...</div>
        ) : userListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userListings.map(book => (
              <BookCard key={book.id} book={book} onClick={() => { }} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No books listed for sale</h3>
            <p className="text-gray-500 mb-6">Start earning by listing your pre-loved books.</p>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              List Your First Book
            </Button>
          </div>
        )}
      </div>

      {/* Render Wizard as Modal */}
      {showWizard && (
        <SellBookWizard onClose={() => setShowWizard(false)} />
      )}
    </div>
  );
}