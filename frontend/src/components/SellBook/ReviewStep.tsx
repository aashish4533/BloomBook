// src/components/SellBook/ReviewStep.tsx
import { BookFormData, LocationData } from '../SellBookFlow';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { BookOpen, MapPin, Edit2, CheckCircle, Loader2 } from 'lucide-react'; // Import Loader2

interface ReviewStepProps {
  bookData: BookFormData;
  locationData: LocationData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
  isSubmitting: boolean; // New prop
}

export function ReviewStep({ bookData, locationData, onSubmit, onBack, onEdit, isSubmitting }: ReviewStepProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New':
      case 'Like New':
        return 'bg-green-100 text-green-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800';
      case 'Fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'Poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryMethodText = (method: string) => {
    switch (method) {
      case 'pickup':
        return 'Local Pickup Only';
      case 'shipping':
        return 'Shipping Only';
      case 'both':
        return 'Both Pickup & Shipping';
      default:
        return method;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#C4A672]/10 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-[#C4A672]" />
        </div>
        <div>
          <h3 className="text-[#2C3E50]">Review Your Listing</h3>
          <p className="text-gray-600 text-sm">Please review all details before submitting</p>
        </div>
      </div>

      {/* Book Details Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C4A672]" />
            <h4 className="text-[#2C3E50]">Book Details</h4>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(1)}
            disabled={isSubmitting}
            className="text-[#C4A672] hover:text-[#8B7355]"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ISBN</p>
            <p className="text-[#2C3E50]">{bookData.isbn}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Condition</p>
            <Badge className={getConditionColor(bookData.condition)}>
              {bookData.condition}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Book Title</p>
          <p className="text-[#2C3E50]">{bookData.bookName}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Author</p>
          <p className="text-[#2C3E50]">{bookData.author}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="text-[#2C3E50]">{bookData.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="text-2xl text-[#C4A672]">Rs. {parseFloat(bookData.price).toFixed(2)}</p>
          </div>
        </div>

        {bookData.publishedYear && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Published Year</p>
              <p className="text-[#2C3E50]">{bookData.publishedYear}</p>
            </div>
            {bookData.pages && (
              <div>
                <p className="text-sm text-gray-500">Pages</p>
                <p className="text-[#2C3E50]">{bookData.pages}</p>
              </div>
            )}
          </div>
        )}

        {bookData.language && (
          <div>
            <p className="text-sm text-gray-500">Language</p>
            <p className="text-[#2C3E50]">{bookData.language}</p>
          </div>
        )}

        {bookData.description && (
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-[#2C3E50] text-sm">{bookData.description}</p>
          </div>
        )}
      </div>

      {/* Location & Delivery Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#C4A672]" />
            <h4 className="text-[#2C3E50]">Location & Delivery</h4>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(2)}
            disabled={isSubmitting}
            className="text-[#C4A672] hover:text-[#8B7355]"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>

        <Separator />

        <div>
          <p className="text-sm text-gray-500">Delivery Method</p>
          <p className="text-[#2C3E50]">{getDeliveryMethodText(locationData.method)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Location</p>
          <p className="text-[#2C3E50]">
            {locationData.address}<br />
            {locationData.city}, {locationData.state} {locationData.zipCode}
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-r from-[#C4A672]/10 to-[#8B7355]/10 rounded-lg p-6 border-2 border-[#C4A672]/20">
        <h4 className="text-[#2C3E50] mb-3">Listing Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Book:</span>
            <span className="text-[#2C3E50]">{bookData.bookName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Price:</span>
            <span className="text-[#2C3E50]">Rs. {parseFloat(bookData.price).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Condition:</span>
            <span className="text-[#2C3E50]">{bookData.condition}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Delivery:</span>
            <span className="text-[#2C3E50]">{getDeliveryMethodText(locationData.method)}</span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>Important:</strong> By submitting this listing, you agree to our Terms of Service and confirm that all information provided is accurate. You will be responsible for fulfilling any orders placed for this book.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-6"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-[#C4A672] hover:bg-[#8B7355] text-white px-8 min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Listing'
          )}
        </Button>
      </div>
    </div>
  );
}