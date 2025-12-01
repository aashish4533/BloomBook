import { useState } from 'react';
import { RentalBrowse } from './Rental/RentalBrowse';
import { RentalBookDetails } from './Rental/RentalBookDetails';
import { RentalConfirmation } from './Rental/RentalConfirmation';
import { RentalSuccess } from './Rental/RentalSuccess';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

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

  const handleCompleteRental = async () => {
    if (!selectedBook || !auth.currentUser) return;

    try {
      const startDate = new Date();
      const dueDate = new Date();
      if (rentalPeriod === 'weekly') dueDate.setDate(startDate.getDate() + 7);
      if (rentalPeriod === 'monthly') dueDate.setDate(startDate.getDate() + 30);
      if (rentalPeriod === 'yearly') dueDate.setDate(startDate.getDate() + 365);

      const rentalRef = await addDoc(collection(db, 'rentals'), {
        renterId: auth.currentUser.uid,
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        author: selectedBook.author,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'active',
        price: selectedBook.rentalOptions[rentalPeriod],
        rentalPeriod: rentalPeriod,
        createdAt: serverTimestamp()
      });

      // Also save to transactions collection for Admin Dashboard
      await addDoc(collection(db, 'transactions'), {
        type: 'rent',
        bookTitle: selectedBook.title,
        user: auth.currentUser.displayName || auth.currentUser.email || 'Unknown User',
        amount: selectedBook.rentalOptions[rentalPeriod],
        date: new Date().toISOString(),
        status: 'completed',
        relatedId: rentalRef.id,
        createdAt: serverTimestamp()
      });

      setCurrentStep('success');
    } catch (error) {
      console.error('Error saving rental:', error);
      toast.error('Failed to process rental. Please try again.');
    }
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
