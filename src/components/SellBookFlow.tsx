import { useState } from 'react';
import { BookDetailsStep } from './SellBook/BookDetailsStep';
import { LocationStep } from './SellBook/LocationStep';
import { ReviewStep } from './SellBook/ReviewStep';
import { SuccessStep } from './SellBook/SuccessStep';
import { X } from 'lucide-react';

export interface BookFormData {
  isbn: string;
  bookName: string;
  author: string;
  price: string;
  condition: string;
  category: string;
  description: string;
  publishedYear: string;
  language: string;
  pages: string;
  images: string[];
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

export function SellBookFlow({ onClose }: SellBookFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookData, setBookData] = useState<BookFormData>({
    isbn: '',
    bookName: '',
    author: '',
    price: '',
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

  const handleSubmit = () => {
    console.log('Submitting book listing:', { bookData, locationData });
    setCurrentStep(4);
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                    className={`h-2 rounded-full transition-colors ${
                      step <= currentStep
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
