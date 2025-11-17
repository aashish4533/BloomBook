import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmation({ onConfirm, onCancel }: LogoutConfirmationProps) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#2C3E50] flex items-center gap-2">
            <LogOut className="w-6 h-6" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>Are you sure you want to log out?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-gray-600">
            You will need to sign in again to access your account and continue using BookOra.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              No, Stay Logged In
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Yes, Log Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
