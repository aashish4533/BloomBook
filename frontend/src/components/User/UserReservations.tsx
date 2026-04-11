import { useMemo, type ComponentProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { ExchangeRequestCard } from '../Exchange/ExchangeRequestCard';
import { Bookmark, MessageSquare, ShoppingBag, Calendar, ArrowLeftRight } from 'lucide-react';

interface PurchaseRow {
  id: string;
  bookTitle: string;
  author: string;
  price: number;
  timestamp?: unknown;
  createdAt?: unknown;
  status?: string;
  pickupDeadline?: string;
}

interface RentalRow {
  id: string;
  bookTitle: string;
  author: string;
  status: string;
  role: 'borrower' | 'lender';
  price: number;
}

function exchangeShowsInReservations(data: Record<string, unknown>): boolean {
  const st = String(data.status || '');
  if (st === 'rejected' || st === 'completed') return false;
  return st === 'pending' || st === 'chatting' || st === 'accepted' || st === 'both_accepted';
}

function displayPurchaseDate(purchase: PurchaseRow) {
  const t = purchase.timestamp ?? purchase.createdAt;
  if (!t) return 'N/A';
  if (typeof t === 'string') return new Date(t).toLocaleDateString();
  if (typeof (t as { toDate?: () => Date }).toDate === 'function') return (t as { toDate: () => Date }).toDate().toLocaleDateString();
  return 'N/A';
}

const formatRs = (p: number) =>
  `Rs. ${Number(p).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function UserReservations() {
  const navigate = useNavigate();
  const [user, loadingUser] = useAuthState(auth);

  const [purchasesSnap, loadingPurchases, errPurchases] = useCollection(
    user ? query(collection(db, 'purchases'), where('buyerId', '==', user.uid), orderBy('timestamp', 'desc')) : null
  );
  const [asRenterSnap, loadingRenter, errRenter] = useCollection(
    user ? query(collection(db, 'rentals'), where('renterId', '==', user.uid)) : null
  );
  const [asLenderSnap, loadingLender, errLender] = useCollection(
    user ? query(collection(db, 'rentals'), where('lenderId', '==', user.uid)) : null
  );
  const [incomingExSnap, loadingInEx, errInEx] = useCollection(
    user
      ? query(collection(db, 'exchanges'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc'))
      : null
  );
  const [sentExSnap, loadingSentEx, errSentEx] = useCollection(
    user
      ? query(collection(db, 'exchanges'), where('requesterId', '==', user.uid), orderBy('createdAt', 'desc'))
      : null
  );

  const loading =
    loadingUser ||
    loadingPurchases ||
    loadingRenter ||
    loadingLender ||
    loadingInEx ||
    loadingSentEx;
  const error = errPurchases || errRenter || errLender || errInEx || errSentEx;

  const reservedPurchases = useMemo(() => {
    if (!purchasesSnap) return [];
    return purchasesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as PurchaseRow))
      .filter((p) => p.status === 'reserved');
  }, [purchasesSnap]);

  const reservedRentals = useMemo(() => {
    const map = new Map<string, RentalRow>();
    asRenterSnap?.docs.forEach((d) => {
      const x = d.data();
      if (x.status !== 'reserved_rent') return;
      map.set(d.id, {
        id: d.id,
        bookTitle: x.bookTitle || 'Book',
        author: x.author || '',
        status: x.status,
        role: 'borrower',
        price: typeof x.price === 'number' ? x.price : Number(x.rentAmount) || 0,
      });
    });
    asLenderSnap?.docs.forEach((d) => {
      const x = d.data();
      if (x.status !== 'reserved_rent') return;
      if (map.has(d.id)) return;
      map.set(d.id, {
        id: d.id,
        bookTitle: x.bookTitle || 'Book',
        author: x.author || '',
        status: x.status,
        role: 'lender',
        price: typeof x.price === 'number' ? x.price : Number(x.rentAmount) || 0,
      });
    });
    return Array.from(map.values());
  }, [asRenterSnap, asLenderSnap]);

  const activeExchanges = useMemo(() => {
    const byId = new Map<string, { id: string; data: Record<string, unknown> }>();
    incomingExSnap?.docs.forEach((d) => {
      const data = d.data();
      if (exchangeShowsInReservations(data as Record<string, unknown>)) byId.set(d.id, { id: d.id, data });
    });
    sentExSnap?.docs.forEach((d) => {
      const data = d.data();
      if (exchangeShowsInReservations(data as Record<string, unknown>)) byId.set(d.id, { id: d.id, data });
    });
    return Array.from(byId.values()).map(({ id, data }) => ({ id, ...data })) as ComponentProps<
      typeof ExchangeRequestCard
    >['request'][];
  }, [incomingExSnap, sentExSnap]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Please log in.</div>;

  const totalCount = reservedPurchases.length + reservedRentals.length + activeExchanges.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-[#C4A672]" />
        <div>
          <h2 className="text-2xl font-semibold text-[#2C3E50]">Reservations</h2>
          <p className="text-gray-600 text-sm">
            Active holds: local pickup purchases, rentals before handover, and in-progress exchanges.
          </p>
        </div>
      </div>

      {totalCount === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500 border border-dashed">
          You have no active reservations. Reserved buys, rentals awaiting pickup, and open exchange requests will appear here.
        </div>
      )}

      {reservedPurchases.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-[#C4A672]" />
            <h3 className="text-[#2C3E50] text-lg">Buy — reserved (pickup)</h3>
          </div>
          <div className="space-y-4">
            {reservedPurchases.map((purchase) => (
              <div key={purchase.id} className="border border-amber-200 bg-amber-50/40 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div>
                    <h5 className="text-[#2C3E50]">{purchase.bookTitle}</h5>
                    <p className="text-sm text-gray-600">by {purchase.author}</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 shrink-0">Reserved</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span>Ref #{purchase.id.slice(0, 10)}…</span>
                  <span>•</span>
                  <span>{displayPurchaseDate(purchase)}</span>
                  <span>•</span>
                  <span className="text-[#C4A672]">{formatRs(purchase.price ?? 0)}</span>
                </div>
                {purchase.pickupDeadline && (
                  <p className="text-sm text-amber-900 mt-2">
                    Complete local pickup by{' '}
                    <strong>{new Date(purchase.pickupDeadline).toLocaleString()}</strong> or the reservation may be released.
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link to="/dashboard/purchases">View purchases</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {reservedRentals.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-[#C4A672]" />
            <h3 className="text-[#2C3E50] text-lg">Rent — reserved (handover pending)</h3>
          </div>
          <div className="space-y-4">
            {reservedRentals.map((rental) => (
              <div key={rental.id} className="border border-amber-200 bg-amber-50/40 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div>
                    <h5 className="text-[#2C3E50]">{rental.bookTitle}</h5>
                    <p className="text-sm text-gray-600">by {rental.author}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rental.role === 'borrower' ? 'You are borrowing' : 'You are lending'}
                    </p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 shrink-0">Reserved</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Rental period has not started. Complete assurances and chat on the handover page.
                </p>
                <Button
                  size="sm"
                  className="bg-[#C4A672] hover:bg-[#8B7355] text-white"
                  onClick={() => navigate(`/rental/${rental.id}/handover`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Handover & chat
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeExchanges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#C4A672]" />
              <h3 className="text-[#2C3E50] text-lg">Exchange — in progress</h3>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/exchanges">All exchanges</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {activeExchanges.map((req) => (
              <ExchangeRequestCard key={req.id} request={req} isIncoming={user.uid === req.ownerId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
