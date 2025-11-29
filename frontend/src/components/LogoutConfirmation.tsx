import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { LogOut, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LogoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      toast.success('Logged out successfully', {
        icon: <CheckCircle className="w-4 h-4" />,
        duration: 2000
      });
      onConfirm();
    }, 500);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md shadow-hover">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <LogOut className="w-6 h-6" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>Are you sure you want to log out?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-gray-600">
            You will need to sign in again to access your account and continue using Book Bloom.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 hover:bg-gray-50 transition-smooth"
              disabled={isLoggingOut}
            >
              <X className="w-4 h-4 mr-2" />
              No, Stay Logged In
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale"
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
