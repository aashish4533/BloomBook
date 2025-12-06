import { useState } from 'react';
import { RentalBrowse } from './Rental/RentalBrowse';
import { RentalBookDetails } from './Rental/RentalBookDetails';
import { RentalConfirmation } from './Rental/RentalConfirmation';
import { RentalSuccess } from './Rental/RentalSuccess';
import { GiveBooksOnRent } from './GiveBooksOnRent';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { BookOpen, HandCoins, ArrowLeft } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState<'selection' | 'browse' | 'lend' | 'details' | 'confirm' | 'success'>('selection');
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
      {currentStep === 'selection' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <Button variant="ghost" onClick={onClose} className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <h1 className="text-3xl font-bold text-[#2C3E50] text-center mb-12">
              What would you like to do?
            </h1>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Borrow Option */}
              <div
                onClick={() => setCurrentStep('browse')}
                className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-[#C4A672] cursor-pointer transition-all group text-center"
              >
                <div className="w-20 h-20 bg-[#C4A672]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#C4A672]/20 transition-colors">
                  <BookOpen className="w-10 h-10 text-[#C4A672]" />
                </div>
                <h3 className="text-2xl font-semibold text-[#2C3E50] mb-3">Borrow a Book</h3>
                <p className="text-gray-600">
                  Browse our collection of books available for rent. Perfect for students and avid readers.
                </p>
                <Button className="mt-6 bg-[#C4A672] text-white hover:bg-[#8B7355] w-full">
                  Start Borrowing
                </Button>
              </div>

              {/* Lend Option */}
              <div
                onClick={() => setCurrentStep('lend')}
                className="bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-[#C4A672] cursor-pointer transition-all group text-center"
              >
                <div className="w-20 h-20 bg-[#2C3E50]/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#2C3E50]/20 transition-colors">
                  <HandCoins className="w-10 h-10 text-[#2C3E50]" />
                </div>
                <h3 className="text-2xl font-semibold text-[#2C3E50] mb-3">Lend a Book</h3>
                <p className="text-gray-600">
                  Put your idle books to work. Rent them out to others and earn passive income.
                </p>
                <Button variant="outline" className="mt-6 border-[#2C3E50] text-[#2C3E50] hover:bg-[#2C3E50] hover:text-white w-full">
                  Start Lending
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'browse' && (
        <RentalBrowse onSelectBook={handleSelectBook} onClose={() => setCurrentStep('selection')} />
      )}

      {currentStep === 'lend' && (
        <GiveBooksOnRent onClose={() => setCurrentStep('selection')} />
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
