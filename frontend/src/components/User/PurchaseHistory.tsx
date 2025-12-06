import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';

interface Purchase {
  id: string;
  bookTitle: string;
  author: string;
  price: number;
  date: string;
  status: 'completed' | 'shipped' | 'delivered';
}

export function PurchaseHistory() {
  const [user, loadingUser] = useAuthState(auth);
  const [purchasesSnapshot, loadingPurchases, error] = useCollection(
    user ? query(collection(db, 'purchases'), where('buyerId', '==', user.uid), orderBy('date', 'desc')) : null
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingUser || loadingPurchases) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const purchases = purchasesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Purchase)) || [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Purchase History</h3>
            <p className="text-gray-600 text-sm">View all your book purchases</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="text-[#2C3E50]">{purchase.bookTitle}</h5>
                  <p className="text-sm text-gray-600">by {purchase.author}</p>
                </div>
                <Badge className={getStatusColor(purchase.status)}>
                  {purchase.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Order #{purchase.id}</span>
                <span>•</span>
                <span>{new Date(purchase.date).toLocaleDateString()}</span>
                <span>•</span>
                <span className="text-[#C4A672]">${purchase.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {purchases.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No purchase history found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}