<<<<<<< HEAD
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { LogOut, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
=======
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { LogOut, X } from 'lucide-react';
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b

interface LogoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
<<<<<<< HEAD
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
=======
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#2C3E50] flex items-center gap-2">
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            <LogOut className="w-6 h-6" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>Are you sure you want to log out?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-gray-600">
<<<<<<< HEAD
            You will need to sign in again to access your account and continue using Book Bloom.
=======
            You will need to sign in again to access your account and continue using BookOra.
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
<<<<<<< HEAD
              className="flex-1 hover:bg-gray-50 transition-smooth"
              disabled={isLoggingOut}
=======
              className="flex-1"
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            >
              <X className="w-4 h-4 mr-2" />
              No, Stay Logged In
            </Button>
            <Button
<<<<<<< HEAD
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale"
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
=======
              onClick={onConfirm}
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Yes, Log Out
>>>>>>> 88a5271c495e1c8115c21cf85b9d6c3edee4b94b
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
