import { Button } from '../ui/button';
import { CheckCircle, Home, Plus } from 'lucide-react';

interface SuccessStepProps {
  onClose: () => void;
  onAddAnother: () => void;
}

export function SuccessStep({ onClose, onAddAnother }: SuccessStepProps) {
  return (
    <div className="p-12 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-[#2C3E50] text-3xl mb-3">Listing Created Successfully!</h2>
        <p className="text-gray-600 text-lg">
          Your book is now available in the marketplace
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#C4A672]/10 to-[#8B7355]/10 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="text-[#2C3E50] mb-3">What happens next?</h3>
        <ul className="text-left space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Your listing is now visible to buyers</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>You'll receive notifications when someone is interested</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>You can manage your listings from your dashboard</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
        <Button
          onClick={onAddAnother}
          variant="outline"
          className="px-6 border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672] hover:text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          List Another Book
        </Button>
        <Button
          onClick={onClose}
          className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    </div>
  );
}
