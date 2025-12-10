// Updated src/components/Admin/UserEditModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

export function UserEditModal({ user, onClose, onSave }: UserEditModalProps) {
  const [editedUser, setEditedUser] = useState(user);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.id), editedUser);
      onSave(editedUser);
      toast.success('User updated');
    } catch (err) {
      toast.error('Failed to update user');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#2C3E50]">Edit User</DialogTitle>
          <DialogDescription>Update user information and account status</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editedUser.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editedUser.email}
                disabled
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Account Status</Label>
              <Select
                value={editedUser.status}
                onValueChange={(value: any) => setEditedUser({ ...editedUser, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={editedUser.location}
                onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-[#2C3E50] mb-3">Account Activity</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Purchases</p>
                <p className="text-[#2C3E50] text-xl">{editedUser.totalPurchases}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Sales</p>
                <p className="text-[#2C3E50] text-xl">{editedUser.totalSales}</p>
              </div>
              <div>
                <p className="text-gray-600">Member Since</p>
                <p className="text-[#2C3E50]">
                  {new Date(editedUser.joinedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}