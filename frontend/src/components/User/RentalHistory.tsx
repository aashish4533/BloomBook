import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, RefreshCw, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useNavigate } from 'react-router-dom';

interface RentalRow {
  id: string;
  bookTitle: string;
  author: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  price: number;
  role: 'borrower' | 'lender';
}

function sortRentals(a: RentalRow, b: RentalRow) {
  const ta = a.dueDate || a.startDate || '';
  const tb = b.dueDate || b.startDate || '';
  return tb.localeCompare(ta);
}

export function RentalHistory() {
  const navigate = useNavigate();
  const [user, loadingUser] = useAuthState(auth);
  const [asRenterSnap, loadingRenter, errRenter] = useCollection(
    user ? query(collection(db, 'rentals'), where('renterId', '==', user.uid)) : null
  );
  const [asLenderSnap, loadingLender, errLender] = useCollection(
    user ? query(collection(db, 'rentals'), where('lenderId', '==', user.uid)) : null
  );

  const loadingRentals = loadingRenter || loadingLender;
  const error = errRenter || errLender;

  const rentals = useMemo(() => {
    const map = new Map<string, RentalRow>();
    asRenterSnap?.docs.forEach((d) => {
      const x = d.data();
      map.set(d.id, {
        id: d.id,
        bookTitle: x.bookTitle || 'Book',
        author: x.author || '',
        startDate: x.startDate ?? null,
        dueDate: x.dueDate ?? null,
        status: x.status || 'active',
        price: typeof x.price === 'number' ? x.price : Number(x.rentAmount) || 0,
        role: 'borrower',
      });
    });
    asLenderSnap?.docs.forEach((d) => {
      const x = d.data();
      if (map.has(d.id)) return;
      map.set(d.id, {
        id: d.id,
        bookTitle: x.bookTitle || 'Book',
        author: x.author || '',
        startDate: x.startDate ?? null,
        dueDate: x.dueDate ?? null,
        status: x.status || 'active',
        price: typeof x.price === 'number' ? x.price : Number(x.rentAmount) || 0,
        role: 'lender',
      });
    });
    return Array.from(map.values()).sort(sortRentals);
  }, [asRenterSnap, asLenderSnap]);

  if (loadingUser || loadingRentals) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const reservedRentals = rentals.filter((r) => r.status === 'reserved_rent');
  const activeRentals = rentals.filter((r) => r.status === 'active');
  const pastRentals = rentals.filter((r) => r.status !== 'active' && r.status !== 'reserved_rent');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Rental History</h3>
            <p className="text-gray-600 text-sm">Books you are borrowing or lending</p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-[#2C3E50] mb-3">Reserved (pickup pending)</h4>
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
            {reservedRentals.length === 0 && <p className="text-center text-gray-500 py-4">No reserved rentals</p>}
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-[#2C3E50] mb-3">Active Rentals</h4>
          <div className="space-y-4">
            {activeRentals.map((rental) => (
              <div key={rental.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="text-[#2C3E50]">{rental.bookTitle}</h5>
                    <p className="text-sm text-gray-600">by {rental.author}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rental.role === 'borrower' ? 'Borrowing' : 'Lending'}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                {rental.dueDate && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {new Date(rental.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/rental/${rental.id}/handover`)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button size="sm" variant="outline">
                    Return Book
                  </Button>
                </div>
              </div>
            ))}
            {activeRentals.length === 0 && <p className="text-center text-gray-500 py-4">No active rentals</p>}
          </div>
        </div>

        <div>
          <h4 className="text-[#2C3E50] mb-3">Past Rentals</h4>
          <div className="space-y-3">
            {pastRentals.map((rental) => (
              <div key={rental.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-[#2C3E50]">{rental.bookTitle}</h5>
                    <p className="text-sm text-gray-600">by {rental.author}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rental.role === 'borrower' ? 'Borrowed' : 'Lent'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 flex-wrap">
                      {rental.startDate && rental.dueDate && (
                        <span>
                          {new Date(rental.startDate).toLocaleDateString()} – {new Date(rental.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-[#C4A672]">Rs. {rental.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">{rental.status}</Badge>
                </div>
              </div>
            ))}
            {pastRentals.length === 0 && <p className="text-center text-gray-500 py-4">No past rentals</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
