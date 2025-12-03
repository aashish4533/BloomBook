import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';

interface Rental {
  id: string;
  bookTitle: string;
  author: string;
  startDate: string;
  dueDate: string;
  status: 'active' | 'returned' | 'overdue';
  price: number;
}

export function RentalHistory() {
  const [user, loadingUser] = useAuthState(auth);
  const [rentalsSnapshot, loadingRentals, error] = useCollection(
    user ? query(collection(db, 'rentals'), where('renterId', '==', user.uid), orderBy('startDate', 'desc')) : null
  );

  if (loadingUser || loadingRentals) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const rentals = rentalsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rental)) || [];
  const activeRentals = rentals.filter(r => r.status === 'active');
  const pastRentals = rentals.filter(r => r.status !== 'active');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Rental History</h3>
            <p className="text-gray-600 text-sm">Manage your active and past rentals</p>
          </div>
        </div>

        {/* Active Rentals */}
        <div className="mb-6">
          <h4 className="text-[#2C3E50] mb-3">Active Rentals</h4>
          <div className="space-y-4">
            {activeRentals.map((rental) => (
              <div key={rental.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="text-[#2C3E50]">{rental.bookTitle}</h5>
                    <p className="text-sm text-gray-600">by {rental.author}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(rental.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew
                  </Button>
                  <Button size="sm" variant="outline">
                    Return Book
                  </Button>
                </div>
              </div>
            ))}
            {activeRentals.length === 0 && (
              <p className="text-center text-gray-500 py-4">No active rentals</p>
            )}
          </div>
        </div>

        {/* Past Rentals */}
        <div>
          <h4 className="text-[#2C3E50] mb-3">Past Rentals</h4>
          <div className="space-y-3">
            {pastRentals.map((rental) => (
              <div key={rental.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-[#2C3E50]">{rental.bookTitle}</h5>
                    <p className="text-sm text-gray-600">by {rental.author}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <span>Rented: {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.dueDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-[#C4A672]">${rental.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">{rental.status}</Badge>
                </div>
              </div>
            ))}
            {pastRentals.length === 0 && (
              <p className="text-center text-gray-500 py-4">No past rentals</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}