import { CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ChangePasswordSuccessProps {
  onReturnToProfile: () => void;
}

export function ChangePasswordSuccess({ onReturnToProfile }: ChangePasswordSuccessProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeInUp">
      <div className="bg-white rounded-xl shadow-hover max-w-md w-full p-8 text-center transition-smooth">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h2 className="text-2xl mb-3 text-gray-900">Password Updated!</h2>
        <p className="text-gray-600 mb-6">
          Your password has been changed successfully. You can now use your new password to log in.
        </p>

        <Button
          onClick={onReturnToProfile}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-smooth btn-scale shadow-subtle"
        >
          Return to Profile
        </Button>

        <p className="text-sm text-gray-500 mt-4">
          Make sure to remember your new password
        </p>
      </div>
    </div>
  );
}
