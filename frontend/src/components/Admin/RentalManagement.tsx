// Updated src/components/Admin/RentalManagement.tsx
import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Download, Calendar, Check, X, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

interface Rental {
  id: string;
  bookTitle: string;
  renterName: string;
  renterEmail: string;
  startDate: string;
  dueDate: string;
  status: 'active' | 'pending' | 'overdue' | 'returned';
  rentalPrice: number;
}

export function RentalManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'overdue' | 'returned'>('all');
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentals = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'rentals'));
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            bookTitle: d.bookTitle || 'Unknown Book',
            renterName: d.renterName || 'Unknown Renter',
            renterEmail: d.renterEmail || 'No Email',
            startDate: d.startDate || new Date().toISOString(),
            dueDate: d.dueDate || new Date().toISOString(),
            status: d.status || 'pending',
            rentalPrice: d.rentalPrice || d.price || 0
          } as Rental;
        });
        setRentals(data);
      } catch (err) {
        toast.error('Failed to fetch rentals');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRentals();
  }, []);

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = rental.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.renterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rental.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'rentals', id), { status: 'active' });
      setRentals(prev => prev.map(r => r.id === id ? { ...r, status: 'active' } : r));
      toast.success('Rental approved');
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleDeny = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await updateDoc(doc(db, 'rentals', id), { status: 'returned' });  // Or delete if needed
        setRentals(prev => prev.map(r => r.id === id ? { ...r, status: 'returned' } : r));
        toast.success('Rental denied');
      } catch (err) {
        toast.error('Failed to deny');
      }
    }
  };

  const handleSendReminder = async (id: string) => {
    toast.success('Reminder sent');
    // Implement actual sending if needed
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Active Rentals</p>
          <p className="text-3xl text-[#2C3E50] mt-2">
            {rentals.filter(r => r.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Pending Approvals</p>
          <p className="text-3xl text-yellow-600 mt-2">
            {rentals.filter(r => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Overdue</p>
          <p className="text-3xl text-red-600 mt-2">
            {rentals.filter(r => r.status === 'overdue').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600 text-sm">Monthly Revenue</p>
          <p className="text-3xl text-[#C4A672] mt-2">
            Rs. {rentals.reduce((sum, r) => sum + r.rentalPrice, 0).toFixed(2)}
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
              placeholder="Search by book title or renter name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'overdue', 'returned'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status as any)}
                className={statusFilter === status ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
                size="sm"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Rentals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Book</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Renter</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Start Date</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Due Date</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Price</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredRentals.map((rental) => {
              const daysUntilDue = getDaysUntilDue(rental.dueDate);
              return (
                <tr key={rental.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-[#2C3E50]">{rental.bookTitle}</p>
                    <p className="text-sm text-gray-500">ID: {rental.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#2C3E50]">{rental.renterName}</p>
                    <p className="text-sm text-gray-500">{rental.renterEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(rental.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600">{new Date(rental.dueDate).toLocaleDateString()}</p>
                    {rental.status === 'active' && (
                      <p className={`text-sm ${daysUntilDue < 7 ? 'text-red-600' : 'text-gray-500'}`}>
                        {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(rental.status)}>
                      {rental.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[#C4A672]">
                    ${rental.rentalPrice.toFixed(2)}/mo
                  </td>
                  <td className="px-6 py-4">
                    {rental.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(rental.id)}>
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeny(rental.id)}>
                          <X className="w-4 h-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    ) : rental.status === 'overdue' ? (
                      <Button size="sm" variant="outline" className="text-orange-600" onClick={() => handleSendReminder(rental.id)}>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Send Reminder
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}