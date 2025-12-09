import { useState } from 'react';
import { RentalBook } from '../RentBookFlow';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  MapPin,
  Star,
  Calendar,
  Package,
  Truck,
  BookOpen,
  User
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface RentalBookDetailsProps {
  book: RentalBook;
  onBack: () => void;
  onRent: (period: 'weekly' | 'monthly' | 'yearly') => void;
}

export function RentalBookDetails({ book, onBack, onRent }: RentalBookDetailsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup');

  const getPriceForPeriod = () => {
    return book.rentalOptions[selectedPeriod];
  };

  const getTotalCost = () => {
    let price = getPriceForPeriod();
    if (deliveryMethod === 'shipping') {
      price += 5.99; // Shipping fee
    }
    return price.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Search
          </Button>
          <h1 className="text-[#2C3E50] text-2xl">Book Details</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-8">
              <div className="h-96 bg-gray-200">
                <img
                  src={book.images[0]}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {book.images.length > 1 && (
                <div className="p-4 grid grid-cols-3 gap-2">
                  {book.images.slice(1).map((img, idx) => (
                    <div key={idx} className="h-20 bg-gray-200 rounded overflow-hidden">
                      <img src={img} alt={`${book.title} ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Book Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Title & Basic Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-[#2C3E50] text-2xl mb-2">{book.title}</h2>
                  <p className="text-gray-600 text-lg">by {book.author}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{book.condition}</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>ISBN: {book.isbn}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4" />
                  <span>Category: {book.category}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-[#2C3E50] mb-3">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-[#2C3E50] mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Seller Information
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#C4A672] rounded-full flex items-center justify-center text-white">
                  {book.seller.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[#2C3E50]">{book.seller.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{book.seller.rating}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">Verified Seller</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{book.seller.location}</span>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-[#2C3E50] mb-4">Delivery Method</h3>
              <div className="space-y-3">
                {book.deliveryMethods.includes('pickup') && (
                  <button
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`w-full border-2 rounded-lg p-4 flex items-center gap-3 transition-colors ${deliveryMethod === 'pickup'
                        ? 'border-[#C4A672] bg-[#C4A672]/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Package className="w-5 h-5 text-[#C4A672]" />
                    <div className="text-left flex-1">
                      <p className="text-[#2C3E50]">Local Pickup</p>
                      <p className="text-sm text-gray-600">Free - Pick up from seller</p>
                    </div>
                    {deliveryMethod === 'pickup' && (
                      <div className="w-5 h-5 rounded-full bg-[#C4A672] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                )}
                {book.deliveryMethods.includes('shipping') && (
                  <button
                    onClick={() => setDeliveryMethod('shipping')}
                    className={`w-full border-2 rounded-lg p-4 flex items-center gap-3 transition-colors ${deliveryMethod === 'shipping'
                        ? 'border-[#C4A672] bg-[#C4A672]/5'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Truck className="w-5 h-5 text-[#C4A672]" />
                    <div className="text-left flex-1">
                      <p className="text-[#2C3E50]">Shipping</p>
                      <p className="text-sm text-gray-600">Rs. 5.99 - Delivered to your door</p>
                    </div>
                    {deliveryMethod === 'shipping' && (
                      <div className="w-5 h-5 rounded-full bg-[#C4A672] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Rental Options */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-[#2C3E50] text-xl mb-6">Rental Options</h3>

              {/* Period Selection */}
              <div className="space-y-4 mb-6">
                <label className="text-sm text-gray-700">Select Rental Period</label>
                <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">
                      Weekly - ${book.rentalOptions.weekly}/week
                    </SelectItem>
                    <SelectItem value="monthly">
                      Monthly - ${book.rentalOptions.monthly}/month
                    </SelectItem>
                    <SelectItem value="yearly">
                      Yearly - ${book.rentalOptions.yearly}/year
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rental ({selectedPeriod})</span>
                  <span className="text-[#2C3E50]">${getPriceForPeriod().toFixed(2)}</span>
                </div>
                {deliveryMethod === 'shipping' && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-[#2C3E50]">Rs. 5.99</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[#2C3E50]">Total</span>
                  <span className="text-[#C4A672] text-2xl">${getTotalCost()}</span>
                </div>
              </div>

              {/* Important Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="mb-1">Book must be returned by the end of the rental period</p>
                    <p className="text-blue-700">Late fees: Rs. 2/day</p>
                  </div>
                </div>
              </div>

              {/* Rent Button */}
              <Button
                onClick={() => onRent(selectedPeriod)}
                className="w-full h-12 bg-[#C4A672] hover:bg-[#8B7355] text-white mb-3"
              >
                Continue to Checkout
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our rental terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
