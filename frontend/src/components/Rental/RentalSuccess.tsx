import { RentalBook } from '../RentBookFlow';
import { Button } from '../ui/button';
import { CheckCircle, Calendar, Package, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RentalSuccessProps {
  book: RentalBook;
  rentalId: string;
  onClose: () => void;
}

export function RentalSuccess({ book, rentalId, onClose }: RentalSuccessProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-[#2C3E50] text-3xl mb-2">Rental reserved</h1>
          <p className="text-gray-600 text-lg">
            Coordinate pickup with the lender and confirm handover when you meet.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Rental ID</span>
              <span className="text-[#2C3E50] font-mono text-sm">{rentalId}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="text-[#2C3E50] mb-1">{book.title}</h3>
                <p className="text-gray-600 text-sm">by {book.author}</p>
                <p className="text-sm text-gray-500 mt-2">ISBN: {book.isbn}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-900 mb-3">Next steps</h3>
              <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                <li>Open the handover page to chat with the lender and tick the assurance boxes when ready.</li>
                <li>On your planned pickup day (after both confirmations), your rental period starts automatically.</li>
                <li>Return the book by the due date shown in your rental history.</li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <Calendar className="w-6 h-6 text-[#C4A672] mb-2" />
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <p className="text-[#2C3E50]">Reserved (not active yet)</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <Package className="w-6 h-6 text-[#C4A672] mb-2" />
                <p className="text-sm text-gray-600 mb-1">Handover</p>
                <p className="text-[#2C3E50]">Pickup + assurances</p>
              </div>
            </div>

            <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              Late returns may incur Rs. 2/day after the due date once the rental is active.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate(`/rental/${rentalId}/handover`)}
            className="flex-1 h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            Open handover & chat
          </Button>
          <Button variant="outline" className="flex-1 h-12" onClick={() => navigate('/dashboard/rentals')}>
            View my rentals
          </Button>
          <Button variant="ghost" className="flex-1 h-12" onClick={onClose}>
            <Home className="w-5 h-5 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
