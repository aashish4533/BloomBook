// Updated src/components/User/DeleteAccountModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { auth } from '../../firebase';
import { deleteUser } from 'firebase/auth';
import { toast } from 'sonner';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const [confirmation, setConfirmation] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmation === 'DELETE' && understood) {
      setIsDeleting(true);
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        await deleteUser(user);
        toast.success('Account deleted successfully');
        onClose();
        // Redirect to login or home
      } catch (err: any) {
        if (err.code === 'auth/requires-recent-login') {
          toast.error('Please log out and log in again to delete account');
        } else {
          toast.error('Failed to delete account');
        }
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Delete Account
          </DialogTitle>
          <DialogDescription>This action cannot be undone</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-900 mb-2">Warning</h4>
            <p className="text-sm text-red-800">
              Deleting your account will permanently remove:
            </p>
            <ul className="text-sm text-red-800 list-disc list-inside mt-2 space-y-1">
              <li>All your book listings</li>
              <li>Purchase and rental history</li>
              <li>Saved payment methods</li>
              <li>Wishlist and favorites</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Type "DELETE" to confirm</Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
            />
            <Label htmlFor="understood" className="text-sm cursor-pointer">
              I understand that this action is permanent and cannot be reversed
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || !understood || isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}