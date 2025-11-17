import { useState } from 'react';
import { RentalBrowse } from './Rental/RentalBrowse';
import { RentalBookDetails } from './Rental/RentalBookDetails';
import { RentalConfirmation } from './Rental/RentalConfirmation';
import { RentalSuccess } from './Rental/RentalSuccess';

export interface RentalBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  condition: string;
  category: string;
  images: string[];
  description: string;
  seller: {
    name: string;
    rating: number;
    location: string;
  };
  rentalOptions: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  deliveryMethods: ('pickup' | 'shipping')[];
}

interface RentBookFlowProps {
  onClose: () => void;
}

export function RentBookFlow({ onClose }: RentBookFlowProps) {
  const [currentStep, setCurrentStep] = useState<'browse' | 'details' | 'confirm' | 'success'>('browse');
  const [selectedBook, setSelectedBook] = useState<RentalBook | null>(null);
  const [rentalPeriod, setRentalPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const handleSelectBook = (book: RentalBook) => {
    setSelectedBook(book);
    setCurrentStep('details');
  };

  const handleConfirmRental = (period: 'weekly' | 'monthly' | 'yearly') => {
    setRentalPeriod(period);
    setCurrentStep('confirm');
  };

  const handleCompleteRental = () => {
    setCurrentStep('success');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentStep === 'browse' && (
        <RentalBrowse onSelectBook={handleSelectBook} onClose={onClose} />
      )}
      {currentStep === 'details' && selectedBook && (
        <RentalBookDetails
          book={selectedBook}
          onBack={() => setCurrentStep('browse')}
          onRent={handleConfirmRental}
        />
      )}
      {currentStep === 'confirm' && selectedBook && (
        <RentalConfirmation
          book={selectedBook}
          rentalPeriod={rentalPeriod}
          onBack={() => setCurrentStep('details')}
          onConfirm={handleCompleteRental}
        />
      )}
      {currentStep === 'success' && selectedBook && (
        <RentalSuccess book={selectedBook} onClose={onClose} />
      )}
    </div>
  );
}
