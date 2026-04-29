import { useState } from 'react';
import { RentalBook } from '../RentBookFlow';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Package,
  CheckCircle,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { computeSecurityDepositHalf } from '../../utils/rentalActivation';

interface RentalConfirmationProps {
  book: RentalBook;
  rentalPeriod: 'weekly' | 'monthly' | 'yearly';
  deliveryMethod: 'pickup' | 'shipping';
  pickupDate: string;
  onPickupDateChange: (isoDate: string) => void;
  onBack: () => void;
  onConfirm: () => void | Promise<void>;
}

export function RentalConfirmation({
  book,
  rentalPeriod,
  deliveryMethod,
  pickupDate,
  onPickupDateChange,
  onBack,
  onConfirm,
}: RentalConfirmationProps) {
  const navigate = useNavigate();
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const rentalPrice = book.rentalOptions[rentalPeriod];
  const referenceBookPrice =
    book.originalPrice && book.originalPrice > 0
      ? book.originalPrice
      : Number(book.securityDeposit) > 0
        ? Number(book.securityDeposit) * 2
        : Math.max(rentalPrice * 4, 1);
  const securityDeposit = computeSecurityDepositHalf(referenceBookPrice);
  const shippingFee = deliveryMethod === 'shipping' ? 5.99 : 0;
  const total = rentalPrice + securityDeposit + shippingFee;

  const getDuration = () => {
    switch (rentalPeriod) {
      case 'weekly': return '7 days';
      case 'monthly': return '30 days';
      case 'yearly': return '365 days';
    }
  };

  const getPlannedReturnLabel = () => {
    const days = rentalPeriod === 'weekly' ? 7 : rentalPeriod === 'monthly' ? 30 : 365;
    const start = new Date(pickupDate + 'T12:00:00');
    const date = new Date(start);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleConfirm = async () => {
    if (!agreeToTerms) {
      alert('Please agree to the rental terms and conditions');
      return;
    }

    setIsProcessing(true);
    try {
      await Promise.resolve(onConfirm());
    } catch (error) {
      console.error("Rental confirmation error:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-[#2C3E50] text-2xl">Confirm Your Rental</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Book Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[#2C3E50] text-xl mb-4">Rental Summary</h2>
              <div className="flex gap-4">
                <div className="w-24 h-32 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#2C3E50] mb-1">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                  <p className="text-sm text-gray-500">ISBN: {book.isbn}</p>
                  <p className="text-sm text-gray-500">Condition: {book.condition}</p>
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[#2C3E50] text-xl mb-4">Rental Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#C4A672] mt-0.5" />
                  <div>
                    <p className="text-[#2C3E50]">Rental Period</p>
                    <p className="text-gray-600 text-sm capitalize">{rentalPeriod} ({getDuration()})</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C4A672] mt-0.5" />
                  <div>
                    <p className="text-[#2C3E50]">Planned return (after pickup)</p>
                    <p className="text-gray-600 text-sm">{getPlannedReturnLabel()}</p>
                    <p className="text-gray-500 text-xs mt-1">The rental clock starts on your pickup day once both parties confirm handover.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-[#C4A672] mt-0.5" />
                  <div>
                    <p className="text-[#2C3E50]">Delivery Method</p>
                    <p className="text-gray-600 text-sm">
                      {deliveryMethod === 'pickup'
                        ? 'Local pickup — coordinate time and place with the lender in chat'
                        : 'Shipping to your address'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#C4A672] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[#2C3E50]">Planned pickup date</p>
                    <Input
                      type="date"
                      className="mt-2 max-w-xs"
                      value={pickupDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => onPickupDateChange(e.target.value)}
                    />
                    <p className="text-gray-500 text-xs mt-1">Rental time begins on this day after confirmations.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#C4A672] mt-0.5" />
                  <div>
                    <p className="text-[#2C3E50]">Seller Location</p>
                    <p className="text-gray-600 text-sm">{book.seller.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[#2C3E50] text-xl mb-4">Rental Agreement</h2>

              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto text-sm text-gray-600">
                <h4 className="text-[#2C3E50] mb-2">Terms and Conditions:</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>The book must be returned by the due date to avoid late fees</li>
                  <li>Late fees are Rs. 2 per day after the due date</li>
                  <li>The book must be returned in the same condition as received</li>
                  <li>Any damage to the book will result in additional charges</li>
                  <li>Lost books must be paid for at full replacement value</li>
                  <li>Rental can be extended before the due date for an additional fee</li>
                  <li>Refunds are not available once the book has been shipped</li>
                </ul>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked: boolean | string) => setAgreeToTerms(checked === true)}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                  I have read and agree to the rental terms and conditions, including the return policy and late fee structure
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-[#2C3E50] text-xl mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rental Fee ({rentalPeriod})</span>
                  <span className="text-[#2C3E50]">Rs. {rentalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Security deposit (50% of book price)</span>
                  <span className="text-[#2C3E50]">Rs. {securityDeposit.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-[#2C3E50]">Rs. {shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-[#2C3E50]">Rs. 0.00</span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[#2C3E50]">Total</span>
                  <span className="text-[#C4A672] text-2xl">Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!agreeToTerms || isProcessing}
                className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white mb-3"
              >
                {isProcessing ? 'Processing...' : 'Confirm rental'}
              </Button>

              <Button
                onClick={() => navigate('/dashboard/rentals')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-smooth btn-scale"
              >
                View My Rentals
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
