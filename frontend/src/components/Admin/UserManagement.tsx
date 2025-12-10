import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Edit, Ban, Shield, Trash2 } from 'lucide-react';
import { UserEditModal } from './UserEditModal';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'banned' | 'suspended';
  totalPurchases: number;
  totalSales: number;
  joinedDate: string;
  location: string;
  role: 'user' | 'admin';
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'suspended'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.displayName || d.name || 'Unknown',
            email: d.email || '',
            status: d.status || 'active',
            totalPurchases: d.totalPurchases || 0,
            totalSales: d.totalSales || 0,
            joinedDate: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.joinedDate || new Date().toISOString()),
            location: d.location || 'Unknown',
            role: d.role || 'user'
          } as User;
        });
        setUsers(data);
      } catch (err) {
        toast.error('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleBan = async (id: string) => {
    if (confirm('Ban this user?')) {
      try {
        await updateDoc(doc(db, 'users', id), { status: 'banned' });
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'banned' } : u));
        toast.success('User banned');
      } catch (err) {
        toast.error('Failed to ban user');
      }
    }
  };

  const handleMakeAdmin = async (id: string) => {
    if (confirm('Grant admin privileges to this user?')) {
      try {
        await updateDoc(doc(db, 'users', id), { role: 'admin' });
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'admin' } : u));
        toast.success('User promoted to admin');
      } catch (err) {
        toast.error('Failed to update user role');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'banned', 'suspended'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status as any)}
                className={statusFilter === status ? 'bg-[#C4A672] hover:bg-[#8B7355]' : ''}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-gray-600">User</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Email</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Role</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Location</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Activity</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Joined</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[#2C3E50]">{user.name}</p>
                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className={user.role === 'admin' ? 'bg-[#C4A672]' : ''}>
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge className={getStatusColor(user.status)}>
                    {user.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.location}</td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-600">{user.totalPurchases} purchases</p>
                    <p className="text-gray-600">{user.totalSales} sales</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(user.joinedDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleBan(user.id)}
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
                          // Implement delete logic here or add a function for it
                          // Since direct deletion might require more complex logic (auth + firestore), 
                          // I'll assume just Firestore doc deletion for now as per "admin can delete user".
                          // I'll add the function `handleDeleteUser` above and call it here.
                          // But wait, I need to define `handleDeleteUser` first.
                          // I will insert the call here and define the function in another edit to the main component body.
                          // Actually, I can inline the logic if it's simple or just call a new function `handleDelete`.
                          handleDeleteUser(user.id);
                        }
                      }}
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {user.role !== 'admin' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#C4A672] hover:text-[#8B7355]"
                        onClick={() => handleMakeAdmin(user.id)}
                        title="Make Admin"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Edit Modal */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={(updatedUser) => {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}