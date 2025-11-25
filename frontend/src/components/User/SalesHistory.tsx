// Updated src/components/User/SalesHistory.tsx
import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { DollarSign } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

interface Sale {
  id: string;
  bookTitle: string;
  buyerName: string;
  price: number;
  date: string;
  status: 'sold' | 'pending';
}

export function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchSales = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'sales'),
          where('sellerId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        setSales(data);

        const earnings = data
          .filter(s => s.status === 'sold')
          .reduce((sum, s) => sum + s.price, 0);
        setTotalEarnings(earnings);
      } catch (err) {
        toast.error('Failed to fetch sales');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[#2C3E50] text-xl">Sales History</h3>
            <p className="text-gray-600 text-sm">Track your book sales and earnings</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm">Total Earnings</p>
            <p className="text-2xl text-[#C4A672]">${totalEarnings.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-[#2C3E50] mb-2">{sale.bookTitle}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Sold to: {sale.buyerName}</span>
                    <span>•</span>
                    <span>{new Date(sale.date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-[#C4A672]">${sale.price.toFixed(2)}</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">{sale.status}</Badge>
              </div>
            </div>
          ))}
          {sales.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No sales history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}