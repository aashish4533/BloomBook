import { RentalBook } from '../RentBookFlow';
import { Button } from '../ui/button';
import { CheckCircle, Calendar, Package, Mail, Home } from 'lucide-react';

interface RentalSuccessProps {
  book: RentalBook;
  onClose: () => void;
}

export function RentalSuccess({ book, onClose }: RentalSuccessProps) {
  const rentalId = 'RNT-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-[#2C3E50] text-3xl mb-2">Rental Confirmed!</h1>
          <p className="text-gray-600 text-lg">Your book rental has been successfully processed</p>
        </div>

        {/* Rental Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Rental ID</span>
              <span className="text-[#2C3E50]">{rentalId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Confirmation Email</span>
              <span className="text-[#2C3E50]">Sent to your inbox</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Book Info */}
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] mb-1">{book.title}</h3>
                <p className="text-gray-600 text-sm">by {book.author}</p>
                <p className="text-sm text-gray-500 mt-2">ISBN: {book.isbn}</p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                What Happens Next?
              </h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>You'll receive a confirmation email with all rental details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>The book will be shipped to your address within 2-3 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>You'll receive tracking information once shipped</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">4</span>
                  <span>Enjoy your book and return it before the due date</span>
                </li>
              </ol>
            </div>

            {/* Important Reminders */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <Calendar className="w-6 h-6 text-[#C4A672] mb-2" />
                <p className="text-sm text-gray-600 mb-1">Due Date</p>
                <p className="text-[#2C3E50]">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <Package className="w-6 h-6 text-[#C4A672] mb-2" />
                <p className="text-sm text-gray-600 mb-1">Shipping Status</p>
                <p className="text-[#2C3E50]">Processing</p>
              </div>
            </div>

            {/* Return Instructions */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-[#2C3E50] mb-2">Return Instructions</h4>
              <p className="text-sm text-gray-600 mb-2">
                A prepaid return label will be included with your shipment. Simply place the book back in the original packaging and drop it off at any USPS location before the due date.
              </p>
              <p className="text-sm text-yellow-700">
                ⚠️ Late returns are subject to a Rs. 2/day late fee
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onClose}
            className="flex-1 h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => alert('Navigating to rental history...')}
          >
            View My Rentals
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Need help?{' '}
            <a href="#" className="text-[#C4A672] hover:underline">
              Contact Support
            </a>
            {' '}or{' '}
            <a href="#" className="text-[#C4A672] hover:underline">
              View FAQs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
