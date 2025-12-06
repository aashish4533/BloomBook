// Updated src/components/Admin/TransactionHistory.tsx
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Download, Calendar } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'rent';
  bookTitle: string;
  user: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
}

export function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'buy' | 'sell' | 'rent'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'transactions'));
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type || 'buy',
            bookTitle: d.bookTitle || 'Unknown Book',
            user: d.user || d.userName || 'Unknown User',
            amount: d.amount || d.price || 0,
            date: d.date || d.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
            status: d.status || 'completed'
          } as Transaction;
        });
        setTransactions(data);
      } catch (err) {
        toast.error('Failed to fetch transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'buy':
        return 'bg-blue-100 text-blue-800';
      case 'sell':
        return 'bg-green-100 text-green-800';
      case 'rent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = () => {
    // Define headers
    const headers = ['Transaction ID', 'Type', 'Book', 'User', 'Amount', 'Date', 'Status'];

    // Convert data to CSV rows
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(txn => {
        const row = [
          txn.id,
          txn.type,
          `"${txn.bookTitle.replace(/"/g, '""')}"`, // Escape quotes in title
          `"${txn.user.replace(/"/g, '""')}"`, // Escape quotes in user
          txn.amount.toFixed(2),
          txn.date,
          txn.status
        ];
        return row.join(',');
      })
    ].join('\n');

    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'transactions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Transactions downloaded successfully');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-3xl text-[#C4A672] mt-2">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Purchases</p>
          <p className="text-3xl text-blue-600 mt-2">
            {transactions.filter(t => t.type === 'buy').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Sales</p>
          <p className="text-3xl text-green-600 mt-2">
            {transactions.filter(t => t.type === 'sell').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Rentals</p>
          <p className="text-3xl text-purple-600 mt-2">
            {transactions.filter(t => t.type === 'rent').length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'buy', 'sell', 'rent'].map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                onClick={() => setTypeFilter(type as any)}
                className={typeFilter === type ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
                size="sm"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Transaction ID</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Type</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Book</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">User</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Amount</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Date</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTransactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-[#2C3E50]">{txn.id}</p>
                </td>
                <td className="px-6 py-4">
                  <Badge className={getTypeColor(txn.type)}>
                    {txn.type}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-600">{txn.bookTitle}</td>
                <td className="px-6 py-4 text-gray-600">{txn.user}</td>
                <td className="px-6 py-4 text-[#C4A672]">${txn.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(txn.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Badge className={getStatusColor(txn.status)}>
                    {txn.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}