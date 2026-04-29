import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from './BookMarketplace';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ArrowLeft, CheckCircle2, MapPin, Package } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface PurchaseConfirmationProps {
  book: Book;
  onClose: () => void;
  onBack: () => void;
}

const RESERVATION_DAYS = 7;

function formatRs(n: number) {
  return `Rs. ${Number(n).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function PurchaseConfirmation({ book, onClose, onBack }: PurchaseConfirmationProps) {
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [processing, setProcessing] = useState(false);
  const [purchaseId, setPurchaseId] = useState('');
  const [pickupDeadlineIso, setPickupDeadlineIso] = useState('');
  const navigate = useNavigate();

  const handleReserveBook = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please log in to reserve');
      return;
    }

    if (book.userId === user.uid) {
      toast.error('You cannot reserve your own listing');
      return;
    }

    const listingStatus = (book as Book & { listingStatus?: string }).listingStatus;
    const reservedBy = (book as Book & { reservedBy?: string }).reservedBy;
    if (listingStatus === 'reserved' && reservedBy && reservedBy !== user.uid) {
      toast.error('This book is reserved by another buyer');
      return;
    }

    setProcessing(true);
    try {
      const reservedUntil = new Date();
      reservedUntil.setDate(reservedUntil.getDate() + RESERVATION_DAYS);
      const pickupDeadline = reservedUntil.toISOString();
      setPickupDeadlineIso(pickupDeadline);

      const price = typeof book.price === 'number' ? book.price : parseFloat(String(book.price));

      const purchaseRef = await addDoc(collection(db, 'purchases'), {
        buyerId: user.uid,
        buyerName: user.displayName || 'Anonymous',
        bookId: book.id,
        bookTitle: book.title,
        author: book.author,
        price,
        image: book.images?.[0] || '',
        sellerId: book.userId || 'unknown',
        status: 'reserved',
        deliveryMethod: 'local_pickup',
        pickupDeadline,
        reservationDays: RESERVATION_DAYS,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'books', book.id), {
        listingStatus: 'reserved',
        reservedBy: user.uid,
        reservedUntil: Timestamp.fromDate(reservedUntil),
        reservationPurchaseId: purchaseRef.id,
        updatedAt: serverTimestamp(),
      });

      if (book.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: book.userId,
          sourceUid: user.uid,
          type: 'system',
          title: 'Book reserved',
          message: `${user.displayName || 'A buyer'} reserved "${book.title}" for ${formatRs(price)}. Pickup within ${RESERVATION_DAYS} days.`,
          read: false,
          timestamp: serverTimestamp(),
          purchaseId: purchaseRef.id,
          bookId: book.id,
        });
      }

      setPurchaseId(purchaseRef.id);
      setStep('success');
      toast.success('Book reserved — complete pickup within 7 days.');
    } catch (error) {
      console.error('Reserve error:', error);
      toast.error('Failed to reserve book');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'success') {
    const deadlineLabel = pickupDeadlineIso
      ? new Date(pickupDeadlineIso).toLocaleString()
      : `within ${RESERVATION_DAYS} days`;

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogDescription className="sr-only">Reservation confirmed for {book.title}</DialogDescription>
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-[#2C3E50] text-2xl mb-3">Book reserved</h2>
            <p className="text-gray-600 mb-6">
              Coordinate local pickup with the seller. If you do not pick up by <strong>{deadlineLabel}</strong>, the
              reservation may be released.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-[#2C3E50] mb-3">Reservation details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-600">Reference:</span>
                  <span className="text-[#2C3E50] truncate max-w-[50%]">{purchaseId.slice(0, 12)}…</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Book:</span>
                  <span className="text-[#2C3E50] text-right">{book.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agreed listing price:</span>
                  <span className="text-[#2C3E50]">{formatRs(book.price)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={onClose} className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white">
                Back to Marketplace
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  navigate('/dashboard/purchases');
                }}
                className="w-full"
              >
                View in Purchases
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const cityState =
    book.location?.city && book.location?.state
      ? `${book.location.city}, ${book.location.state}`
      : book.location?.city || 'Seller location in chat';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="hover:bg-gray-100 rounded-full p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <DialogTitle className="text-2xl text-[#2C3E50]">Purchase Confirmation</DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Confirm local pickup reservation for {book.title}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-[#2C3E50] mb-3">Book Details</h3>
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                <img
                  src={book.images?.[0] || ''}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[#2C3E50] font-medium">{book.title}</h4>
                <p className="text-gray-600 text-sm mt-1">by {book.author}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">{book.condition}</Badge>
                  <span className="text-sm text-gray-600">ISBN: {book.isbn}</span>
                </div>
                <p className="text-[#C4A672] text-xl mt-2 font-semibold">{formatRs(book.price)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-[#2C3E50] mb-3">Seller Information</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C4A672] text-white flex items-center justify-center text-sm">
                {(book.seller?.avatar || book.seller?.name || 'S').toString().slice(0, 2)}
              </div>
              <div>
                <p className="text-[#2C3E50]">{book.seller?.name}</p>
                <p className="text-sm text-gray-600">
                  {book.seller?.rating ?? 0} ★ • {book.seller?.totalSales ?? 0} sales
                </p>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#C4A672]/30 rounded-lg p-4 bg-[#C4A672]/5">
            <h3 className="text-[#2C3E50] mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#C4A672]" />
              Local pickup only
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              There is no shipping on this flow. Meet the seller in person, verify the book, and complete payment directly
              with them unless you have arranged otherwise in the chat.
            </p>
            <div className="flex items-start gap-2 text-sm text-gray-700 bg-white/80 rounded-md p-3 border border-[#C4A672]/20">
              <MapPin className="w-4 h-4 text-[#C4A672] shrink-0 mt-0.5" />
              <span>Approximate area: {cityState}. Exact pickup details should be arranged in &quot;Chat &amp; Deal&quot;.</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#C4A672]/10 to-[#8B7355]/10 rounded-lg p-4 border-2 border-[#C4A672]/20">
            <h3 className="text-[#2C3E50] mb-3">Order summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Book (pickup)</span>
                <span className="text-[#2C3E50]">{formatRs(book.price)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Not applicable</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-[#2C3E50] font-medium">Total to settle with seller</span>
                <span className="text-[#C4A672] text-lg font-semibold">{formatRs(book.price)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Reserving holds the listing for you for {RESERVATION_DAYS} days. Complete pickup before the deadline or
              the seller may release it.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back to Book
            </Button>
            <Button
              type="button"
              onClick={handleReserveBook}
              disabled={processing}
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              {processing ? 'Reserving…' : 'Reserve Book'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
