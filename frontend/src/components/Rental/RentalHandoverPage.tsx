import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Button } from '../ui/button';
import { PrivateChat } from '../Chat/PrivateChat';
import { ArrowLeft, BookOpen, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  addRentalPeriod,
  canActivateReservedRental,
  startOfDay,
} from '../../utils/rentalActivation';

type RentalPeriod = 'weekly' | 'monthly' | 'yearly';

interface RentalDoc {
  id?: string;
  renterId: string;
  lenderId: string;
  bookTitle?: string;
  status?: string;
  rentalPeriod?: RentalPeriod;
  pickupDate?: string;
  borrowerReceivedBook?: boolean;
  lenderReceivedPayments?: boolean;
  rentAmount?: number;
  securityDepositAmount?: number;
  startDate?: string | null;
  dueDate?: string | null;
}

export function RentalHandoverPage() {
  const { rentalId } = useParams<{ rentalId: string }>();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [rental, setRental] = useState<RentalDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{ id: string; name: string; avatar: string; online: boolean } | null>(null);
  const [busy, setBusy] = useState<'borrower' | 'lender' | null>(null);

  useEffect(() => {
    if (!rentalId) return;
    const unsub = onSnapshot(
      doc(db, 'rentals', rentalId),
      (snap) => {
        if (!snap.exists()) {
          setRental(null);
          setLoading(false);
          return;
        }
        setRental({ id: snap.id, ...(snap.data() as Omit<RentalDoc, 'id'>) });
        setLoading(false);
      },
      () => {
        toast.error('Could not load rental');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [rentalId]);

  useEffect(() => {
    if (!rental || !user?.uid || !rentalId) return;

    const tryActivate = async () => {
      if (!canActivateReservedRental(rental)) return;
      if (rental.status !== 'reserved_rent') return;
      const pickupStart = startOfDay(new Date(rental.pickupDate!));
      const startDate = pickupStart.toISOString();
      const dueDate = addRentalPeriod(pickupStart, rental.rentalPeriod || 'monthly').toISOString();
      try {
        await updateDoc(doc(db, 'rentals', rentalId), {
          status: 'active',
          startDate,
          dueDate,
          activatedAt: serverTimestamp(),
        });
        toast.success('Rental period has started — return the book by the due date.');
      } catch (e) {
        console.error(e);
      }
    };

    void tryActivate();
  }, [rental, rentalId, user?.uid]);

  useEffect(() => {
    if (!rental || !user?.uid) {
      setOtherUser(null);
      return;
    }
    const otherId = rental.renterId === user.uid ? rental.lenderId : rental.renterId;
    if (!otherId) return;

    const load = async () => {
      try {
        const uref = doc(db, 'users', otherId);
        const snap = await getDoc(uref);
        let name = 'User';
        let avatar = '';
        if (snap.exists()) {
          const d = snap.data();
          name = d.displayName || d.name || name;
          avatar = d.photoURL || d.avatar || '';
        }
        setOtherUser({ id: otherId, name, avatar, online: true });
      } catch {
        setOtherUser({ id: otherId, name: 'User', avatar: '', online: true });
      }
    };
    void load();
  }, [rental, user?.uid]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center p-8">Please sign in.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        Loading rental…
      </div>
    );
  }

  if (!rental || !rentalId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">Rental not found.</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/rentals')}>
          Back to rentals
        </Button>
      </div>
    );
  }

  if (rental.renterId !== user.uid && rental.lenderId !== user.uid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-gray-600">You do not have access to this rental.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Home
        </Button>
      </div>
    );
  }

  const isBorrower = rental.renterId === user.uid;
  const isLender = rental.lenderId === user.uid;
  const chatId = [rental.renterId, rental.lenderId].sort().join('_');
  const reserved = rental.status === 'reserved_rent';
  const active = rental.status === 'active';

  const onBorrowerAssure = async () => {
    if (!rentalId || !isBorrower) return;
    setBusy('borrower');
    try {
      await updateDoc(doc(db, 'rentals', rentalId), {
        borrowerReceivedBook: true,
        borrowerAssuredAt: serverTimestamp(),
      });
      toast.success('Recorded: you received the book.');
    } catch (e) {
      console.error(e);
      toast.error('Could not save confirmation.');
    } finally {
      setBusy(null);
    }
  };

  const onLenderAssure = async () => {
    if (!rentalId || !isLender) return;
    setBusy('lender');
    try {
      await updateDoc(doc(db, 'rentals', rentalId), {
        lenderReceivedPayments: true,
        lenderAssuredAt: serverTimestamp(),
      });
      toast.success('Recorded: you received rent and security deposit.');
    } catch (e) {
      console.error(e);
      toast.error('Could not save confirmation.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard/rentals')} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Rentals
        </Button>

        <div className="flex items-start gap-3">
          <BookOpen className="w-8 h-8 text-[#C4A672] shrink-0" />
          <div>
            <h1 className="text-2xl text-[#2C3E50]">Rental handover</h1>
            <p className="text-gray-600 mt-1">{rental.bookTitle || 'Book'}</p>
            <p className="text-sm text-gray-500 mt-2">
              {isBorrower ? 'You are borrowing this book.' : 'You are lending this book.'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#2C3E50] font-medium">
            <ShieldCheck className="w-5 h-5 text-[#C4A672]" />
            Mutual assurance
          </div>
          <p className="text-sm text-gray-600">
            The borrower confirms they received the physical book. The lender confirms they received the <strong>rent</strong> and{' '}
            <strong>security deposit</strong> (50% of reference book price). The rental clock starts on the planned pickup day once both are checked
            and today is on or after that date.
          </p>
          {typeof rental.rentAmount === 'number' && typeof rental.securityDepositAmount === 'number' && (
            <p className="text-sm text-gray-700">
              Rent: <span className="text-[#C4A672]">Rs. {rental.rentAmount.toFixed(2)}</span> · Deposit:{' '}
              <span className="text-[#C4A672]">Rs. {rental.securityDepositAmount.toFixed(2)}</span>
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-100 p-4 bg-gray-50/80">
              <p className="text-sm font-medium text-[#2C3E50] mb-2">Borrower</p>
              <p className="text-xs text-gray-600 mb-3">I have received the book in person (or as agreed).</p>
              <Button
                className="w-full bg-[#2C3E50] hover:bg-[#1a252f] text-white"
                disabled={!isBorrower || !!rental.borrowerReceivedBook || busy !== null || !reserved}
                onClick={() => void onBorrowerAssure()}
              >
                {rental.borrowerReceivedBook ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmed
                  </>
                ) : busy === 'borrower' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  'I received the book'
                )}
              </Button>
              {!isBorrower && <p className="text-xs text-gray-500 mt-2">Only the borrower can confirm this.</p>}
            </div>
            <div className="rounded-lg border border-gray-100 p-4 bg-gray-50/80">
              <p className="text-sm font-medium text-[#2C3E50] mb-2">Lender</p>
              <p className="text-xs text-gray-600 mb-3">I have received the rent and security deposit.</p>
              <Button
                className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
                disabled={!isLender || !!rental.lenderReceivedPayments || busy !== null || !reserved}
                onClick={() => void onLenderAssure()}
              >
                {rental.lenderReceivedPayments ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmed
                  </>
                ) : busy === 'lender' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                  </>
                ) : (
                  'I received rent & deposit'
                )}
              </Button>
              {!isLender && <p className="text-xs text-gray-500 mt-2">Only the lender can confirm this.</p>}
            </div>
          </div>
          {reserved && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-3">
              Status: <strong>Reserved</strong> — rental is not active until pickup day and both assurances are complete.
            </p>
          )}
          {active && rental.startDate && rental.dueDate && (
            <p className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-md p-3">
              Rental active from {new Date(rental.startDate).toLocaleDateString()} — due{' '}
              {new Date(rental.dueDate).toLocaleDateString()}.
            </p>
          )}
        </div>

        {otherUser && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-medium text-[#2C3E50] mb-3">Chat with {otherUser.name}</h2>
            <PrivateChat
              embedded
              chatId={chatId}
              otherUser={otherUser}
              currentUserId={user.uid}
              onBack={() => navigate('/dashboard/rentals')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
