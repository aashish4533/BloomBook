import { useState } from 'react';
import { RentalBook } from '../RentBookFlow';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface RentalConfirmationProps {
  book: RentalBook;
  rentalPeriod: 'weekly' | 'monthly' | 'yearly';
  onBack: () => void;
  onConfirm: () => void;
}

export function RentalConfirmation({ book, rentalPeriod, onBack, onConfirm }: RentalConfirmationProps) {
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const rentalPrice = book.rentalOptions[rentalPeriod];
  const shippingFee = 5.99; // Could be dynamic
  const total = rentalPrice + shippingFee;

  const getDuration = () => {
    switch (rentalPeriod) {
      case 'weekly': return '7 days';
      case 'monthly': return '30 days';
      case 'yearly': return '365 days';
    }
  };

  const getDueDate = () => {
    const days = rentalPeriod === 'weekly' ? 7 : rentalPeriod === 'monthly' ? 30 : 365;
    const date = new Date();
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
      // Logic moved to parent component or implemented here?
      // The parent component RentBookFlow actually passes onConfirm={handleCompleteRental}
      // which ALREADY has the logic we saw in RentBookFlow.tsx lines 51-91.
      // Wait, let's re-read RentBookFlow.tsx.
      // Yes, RentBookFlow passes `handleCompleteRental` as `onConfirm`.
      // So this component just needs to call that prop!
      // But wait, the previous code was just simulating a timeout then calling onConfirm.
      // The USER REQUEST says "Debug the onConfirm handler in RentalConfirmation.tsx. Ensure it is successfully creating a document..."
      // Actually, looking at RentBookFlow (lines 51-91), it DOES create the document.
      // So the issue might be that RentalConfirmation wasn't actually calling onConfirm properly or was just doing a timeout.
      // The previous code was:
      // setTimeout(() => {
      //   setIsProcessing(false);
      //   onConfirm();
      // }, 2000);
      //
      // If RentBookFlow's handleCompleteRental is async, we should await it here if we want to show processing state correctly?
      // But onConfirm is defined as () => void in props.
      // Let's assume onConfirm triggers the logic. If the user says it's failing, maybe the props aren't passed right or the validation fails.

      // Let's update this to be robust.

      await onConfirm();
      // We don't unset isProcessing here because onConfirm likely navigates away or shows success.

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
                  <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" />
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
                    <p className="text-[#2C3E50]">Return By</p>
                    <p className="text-gray-600 text-sm">{getDueDate()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-[#C4A672] mt-0.5" />
                  <div>
                    <p className="text-[#2C3E50]">Delivery Method</p>
                    <p className="text-gray-600 text-sm">Shipping to your address</p>
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

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-[#2C3E50] text-xl mb-4">Payment Method</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full border-2 rounded-lg p-4 flex items-center gap-3 transition-colors ${paymentMethod === 'card'
                    ? 'border-[#C4A672] bg-[#C4A672]/5'
                    : 'border-gray-200'
                    }`}
                >
                  <CreditCard className="w-5 h-5 text-[#C4A672]" />
                  <div className="text-left flex-1">
                    <p className="text-[#2C3E50]">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Visa ending in 1234</p>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" maxLength={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="94102" />
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
                  <span className="text-[#2C3E50]">${rentalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-[#2C3E50]">${shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-[#2C3E50]">Rs. 0.00</span>
                </div>
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[#2C3E50]">Total</span>
                  <span className="text-[#C4A672] text-2xl">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!agreeToTerms || isProcessing}
                className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white mb-3"
              >
                {isProcessing ? 'Processing...' : 'Confirm & Pay'}
              </Button>

              <Button
                variant="outline"
                onClick={onBack}
                className="w-full"
              >
                Cancel
              </Button>

              {/* Security Note */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="mb-1">Secure Payment</p>
                    <p className="text-green-700 text-xs">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
