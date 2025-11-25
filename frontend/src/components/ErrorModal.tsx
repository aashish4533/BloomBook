import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ErrorModalProps {
  title?: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ErrorModal({ 
  title = 'Error', 
  message, 
  onClose, 
  onRetry 
}: ErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h2 className="text-[#2C3E50] text-2xl text-center mb-3">{title}</h2>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">{message}</p>

        {/* Actions */}
        <div className="flex gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
          <Button
            onClick={onClose}
            className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
