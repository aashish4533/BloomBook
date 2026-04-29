import { useState } from 'react';
import { RentalBrowse } from './Rental/RentalBrowse';
import { RentalBookDetails } from './Rental/RentalBookDetails';
import { RentalConfirmation } from './Rental/RentalConfirmation';
import { RentalSuccess } from './Rental/RentalSuccess';
import { GiveBooksOnRent } from './GiveBooksOnRent';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { computeSecurityDepositHalf } from '../utils/rentalActivation';
import { notifyChatRecipient } from '../utils/chatNotifications';
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
  userId?: string;
  seller: {
    id?: string;
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
  /** Listing reference price (e.g. original / retail) — security deposit is 50% of this. */
  originalPrice?: number;
  securityDeposit?: number;
}

interface RentBookFlowProps {
  onClose: () => void;
  preSelectedBook?: RentalBook;
}

export function RentBookFlow({ onClose, preSelectedBook }: RentBookFlowProps) {
  const [currentStep, setCurrentStep] = useState<'selection' | 'browse' | 'lend' | 'details' | 'confirm' | 'success'>(
    preSelectedBook ? 'details' : 'selection'
  );
  const [selectedBook, setSelectedBook] = useState<RentalBook | null>(preSelectedBook || null);
  const [rentalPeriod, setRentalPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup');
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSelectBook = (book: RentalBook) => {
    setSelectedBook(book);
    setCurrentStep('details');
  };

  const handleConfirmRental = (period: 'weekly' | 'monthly' | 'yearly') => {
    setRentalPeriod(period);
    setCurrentStep('confirm');
  };

  const [lastRentalId, setLastRentalId] = useState<string | null>(null);

  const handleCompleteRental = async () => {
    if (!selectedBook || !auth.currentUser) return;

    const lenderId = selectedBook.userId || selectedBook.seller?.id;
    if (!lenderId) {
      toast.error('This listing is missing owner information.');
      return;
    }
    if (auth.currentUser.uid === lenderId) {
      toast.error('You cannot rent your own book.');
      return;
    }

    try {
      const rentAmount = selectedBook.rentalOptions[rentalPeriod];
      const referenceBookPrice =
        (selectedBook.originalPrice && selectedBook.originalPrice > 0)
          ? selectedBook.originalPrice
          : (Number(selectedBook.securityDeposit) > 0
              ? Number(selectedBook.securityDeposit) * 2
              : Math.max(rentAmount * 4, 1));
      const securityDepositAmount = computeSecurityDepositHalf(referenceBookPrice);
      const shippingFee = deliveryMethod === 'shipping' ? 5.99 : 0;
      const totalAtCheckout = rentAmount + securityDepositAmount + shippingFee;

      const rentalRef = await addDoc(collection(db, 'rentals'), {
        renterId: auth.currentUser.uid,
        renterName: auth.currentUser.displayName || auth.currentUser.email || 'Renter',
        renterEmail: auth.currentUser.email || '',
        lenderId,
        lenderName: selectedBook.seller.name,
        bookId: selectedBook.id,
        bookTitle: selectedBook.title,
        author: selectedBook.author,
        status: 'reserved_rent',
        rentalPeriod,
        rentAmount,
        securityDepositAmount,
        referenceBookPrice,
        shippingFee,
        deliveryMethod,
        pickupDate,
        price: rentAmount,
        borrowerReceivedBook: false,
        lenderReceivedPayments: false,
        startDate: null,
        dueDate: null,
        createdAt: serverTimestamp(),
      });

      const chatId = [auth.currentUser.uid, lenderId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(
        chatRef,
        {
          participants: [auth.currentUser.uid, lenderId],
          rentalId: rentalRef.id,
          topic: `Rental: ${selectedBook.title}`,
          status: 'active',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const intro = `Rental reserved for "${selectedBook.title}". Pickup date: ${pickupDate}. Rent Rs. ${rentAmount.toFixed(2)}, security deposit Rs. ${securityDepositAmount.toFixed(2)} (50% of book reference price). Please coordinate handover here and confirm on the rental handover page.`;
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: intro,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        displayName: auth.currentUser.displayName || 'Renter',
      });
      await updateDoc(chatRef, {
        lastMessage: intro,
        lastMessageTimestamp: serverTimestamp(),
      });
      notifyChatRecipient({
        recipientUserId: lenderId,
        senderLabel: auth.currentUser.displayName || 'Borrower',
        preview: intro.slice(0, 120),
        chatId,
      });

      await addDoc(collection(db, 'transactions'), {
        type: 'rent',
        buyerId: auth.currentUser.uid,
        sellerId: lenderId,
        bookTitle: selectedBook.title,
        user: auth.currentUser.displayName || auth.currentUser.email || 'Unknown User',
        amount: totalAtCheckout,
        date: new Date().toISOString(),
        status: 'pending_handover',
        relatedId: rentalRef.id,
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'notifications'), {
        userId: lenderId,
        sourceUid: auth.currentUser.uid,
        type: 'rental_reserved',
        title: 'Rental reserved',
        message: `${auth.currentUser.displayName || 'A borrower'} reserved "${selectedBook.title}" for pickup on ${pickupDate}. Open Rentals to confirm payment receipt and handover.`,
        read: false,
        timestamp: serverTimestamp(),
        rentalId: rentalRef.id,
        bookId: selectedBook.id,
      });

      setLastRentalId(rentalRef.id);
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
          deliveryMethod={deliveryMethod}
          onDeliveryMethodChange={setDeliveryMethod}
          onBack={() => setCurrentStep(preSelectedBook ? 'selection' : 'browse')}
          onRent={handleConfirmRental}
        />
      )}

      {currentStep === 'confirm' && selectedBook && (
        <RentalConfirmation
          book={selectedBook}
          rentalPeriod={rentalPeriod}
          deliveryMethod={deliveryMethod}
          pickupDate={pickupDate}
          onPickupDateChange={setPickupDate}
          onBack={() => setCurrentStep('details')}
          onConfirm={handleCompleteRental}
        />
      )}

      {currentStep === 'success' && selectedBook && lastRentalId && (
        <RentalSuccess book={selectedBook} rentalId={lastRentalId} onClose={onClose} />
      )}
    </div>
  );
}
