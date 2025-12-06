import { useState } from 'react';
import { Book } from './BookMarketplace';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, CreditCard, Building2, Wallet, Lock, ShieldCheck, CheckCircle2, AlertCircle, MapPin, Package, Truck } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

interface PurchaseConfirmationProps {
  book: Book;
  onClose: () => void;
  onBack: () => void;
}

export function PurchaseConfirmation({ book, onClose, onBack }: PurchaseConfirmationProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'bank'>('card');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  const shippingCost = deliveryMethod === 'shipping' ? 4.99 : 0;
  const tax = (book.price + shippingCost) * 0.08;
  const total = book.price + shippingCost + tax;

  const [locating, setLocating] = useState(false);
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    zip: ''
  });

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();

        setAddressData({
          street: data.address.road || data.address.house_number || '',
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          zip: data.address.postcode || ''
        });
        toast.success('Location fetched successfully');
      } catch (error) {
        toast.error('Failed to fetch address details');
      } finally {
        setLocating(false);
      }
    }, (error) => {
      toast.error('Unable to retrieve your location');
      setLocating(false);
    });
  };

  const handlePurchase = async () => {
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      toast.error('Please log in to purchase');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create Purchase Record (for Buyer)
      const purchaseRef = await addDoc(collection(db, 'purchases'), {
        buyerId: user.uid,
        buyerName: user.displayName || 'Anonymous',
        bookId: book.id,
        bookTitle: book.title,
        author: book.author,
        price: book.price,
        image: book.images?.[0] || '',
        sellerId: book.userId || 'unknown',
        date: new Date().toISOString(),
        status: 'completed',
        createdAt: serverTimestamp()
      });

      // 2. Create Sale Record (for Seller) - if sellerId exists
      // The Book interface in BookMarketplace passes seller but maybe not id?
      // BookCard passes sellerName. BookDetailModal passes book.
      // Let's assume book.userId holds the seller ID as seen in BookDetailModal ("sellerId: book.userId").
      if (book.userId) {
        await addDoc(collection(db, 'sales'), {
          sellerId: book.userId,
          bookId: book.id,
          bookTitle: book.title,
          price: book.price,
          buyerId: user.uid,
          buyerName: user.displayName || 'Anonymous',
          date: new Date().toISOString(),
          status: 'sold',
          createdAt: serverTimestamp()
        });
      }

      // 3. Create Transaction Record (for Admin)
      await addDoc(collection(db, 'transactions'), {
        type: 'buy',
        bookTitle: book.title,
        user: user.displayName || user.email || 'Unknown User',
        amount: total,
        date: new Date().toISOString(),
        status: 'completed',
        relatedId: purchaseRef.id,
        createdAt: serverTimestamp()
      });

      // 4. Update Book Status if needed (Optional but good)
      // await updateDoc(doc(db, 'books', book.id), { status: 'sold' });

      setStep('success');
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogDescription className="sr-only">
            Purchase confirmation for {book.title}
          </DialogDescription>
          <DialogDescription className="sr-only">
            Purchase confirmation for {book.title}
          </DialogDescription>
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-[#2C3E50] text-2xl mb-3">Purchase Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been confirmed and the seller has been notified.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-[#2C3E50] mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="text-[#2C3E50]">#BO-{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Book:</span>
                  <span className="text-[#2C3E50]">{book.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid:</span>
                  <span className="text-[#2C3E50]">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={onClose}
                className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                Back to Marketplace
              </Button>
              <Button
                variant="outline"
                onClick={() => alert('Order tracking feature coming soon!')}
                className="w-full"
              >
                Track Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (step === 'payment') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('details')}
                className="hover:bg-gray-100 rounded-full p-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <DialogTitle className="text-2xl text-[#2C3E50]">Payment Method</DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              Select payment method for purchasing {book.title}
            </DialogDescription>
            <DialogDescription className="sr-only">
              Select payment method for purchasing {book.title}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Security Badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-900">
                Your payment information is secure and encrypted
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Select Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="w-5 h-5 text-[#C4A672]" />
                      <span>Credit / Debit Card</span>
                    </Label>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 space-y-3 pl-7">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            type="text"
                            placeholder="MM/YY"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            type="text"
                            placeholder="123"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="cardName">Cardholder Name</Label>
                        <Input
                          id="cardName"
                          type="text"
                          placeholder="John Doe"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Wallet className="w-5 h-5 text-[#C4A672]" />
                      <span>PayPal</span>
                    </Label>
                  </div>
                  {paymentMethod === 'paypal' && (
                    <p className="text-sm text-gray-600 mt-2 pl-7">
                      You will be redirected to PayPal to complete your purchase
                    </p>
                  )}
                </div>

                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Building2 className="w-5 h-5 text-[#C4A672]" />
                      <span>Bank Transfer</span>
                    </Label>
                  </div>
                  {paymentMethod === 'bank' && (
                    <p className="text-sm text-gray-600 mt-2 pl-7">
                      Bank transfer instructions will be sent to your email
                    </p>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked: boolean | string) => setAgreeToTerms(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                I agree to the{' '}
                <a href="#" className="text-[#C4A672] hover:underline">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#C4A672] hover:underline">
                  Refund Policy
                </a>
              </Label>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-[#2C3E50] mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Book Price:</span>
                  <span className="text-[#2C3E50]">${book.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-[#2C3E50]">
                    {deliveryMethod === 'pickup' ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8%):</span>
                  <span className="text-[#2C3E50]">${tax.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-[#2C3E50]">Total:</span>
                  <span className="text-[#C4A672] text-lg">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep('details')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handlePurchase}
                disabled={processing}
                className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="hover:bg-gray-100 rounded-full p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <DialogTitle className="text-2xl text-[#2C3E50]">Purchase Confirmation</DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Book Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-[#2C3E50] mb-3">Book Details</h3>
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="text-[#2C3E50]">{book.title}</h4>
                <p className="text-gray-600 text-sm mt-1">by {book.author}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-100 text-blue-800">{book.condition}</Badge>
                  <span className="text-sm text-gray-600">ISBN: {book.isbn}</span>
                </div>
                <p className="text-[#C4A672] text-xl mt-2">${book.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-[#2C3E50] mb-3">Seller Information</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C4A672] text-white flex items-center justify-center">
                {book.seller.avatar}
              </div>
              <div>
                <p className="text-[#2C3E50]">{book.seller.name}</p>
                <p className="text-sm text-gray-600">{book.seller.rating} ★ • {book.seller.totalSales} sales</p>
              </div>
            </div>
          </div>

          {/* Delivery Method */}
          <div className="space-y-3">
            <Label>Delivery Method</Label>
            <RadioGroup value={deliveryMethod} onValueChange={(value: any) => setDeliveryMethod(value)}>
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${deliveryMethod === 'shipping' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="shipping" id="shipping" />
                  <Label htmlFor="shipping" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Truck className="w-5 h-5 text-[#C4A672]" />
                    <div>
                      <div>Shipping</div>
                      <div className="text-xs text-gray-600">Delivery in 3-5 business days</div>
                    </div>
                  </Label>
                  <span className="text-[#2C3E50]">${shippingCost.toFixed(2)}</span>
                </div>
                {deliveryMethod === 'shipping' && (
                  <div className="mt-3 pl-7 space-y-2">
                    <div className="flex justify-end mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseCurrentLocation}
                        disabled={locating}
                        className="h-8 text-xs border-[#C4A672] text-[#C4A672] hover:bg-[#C4A672]/10"
                      >
                        {locating ? <span className="animate-spin mr-2">⏳</span> : <MapPin className="w-3 h-3 mr-1" />}
                        {locating ? 'Locating...' : 'Use Current Location'}
                      </Button>
                    </div>
                    <Input
                      placeholder="Street Address"
                      value={addressData.street}
                      onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        value={addressData.city}
                        onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                      />
                      <Input
                        placeholder="State"
                        value={addressData.state}
                        onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                      />
                    </div>
                    <Input
                      placeholder="ZIP Code"
                      value={addressData.zip}
                      onChange={(e) => setAddressData({ ...addressData, zip: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Package className="w-5 h-5 text-[#C4A672]" />
                    <div>
                      <div>Local Pickup</div>
                      <div className="text-xs text-gray-600">San Francisco, CA</div>
                    </div>
                  </Label>
                  <span className="text-green-600">FREE</span>
                </div>
                {deliveryMethod === 'pickup' && (
                  <div className="mt-3 pl-7">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Pickup location and details will be shared after purchase
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => {
                        let query = encodeURIComponent(book.seller.name + " generic location");
                        if (book.location) {
                          if (book.location.coordinates) {
                            query = `${book.location.coordinates.lat},${book.location.coordinates.lng}`;
                          } else if (book.location.address) {
                            query = encodeURIComponent(book.location.address);
                          } else if (book.location.city) {
                            query = encodeURIComponent(`${book.location.city}, ${book.location.state}`);
                          }
                        }
                        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                      }}
                    >
                      Get Directions (Map)
                    </Button>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-r from-[#C4A672]/10 to-[#8B7355]/10 rounded-lg p-4 border-2 border-[#C4A672]/20">
            <h3 className="text-[#2C3E50] mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Book Price:</span>
                <span className="text-[#2C3E50]">${book.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-[#2C3E50]">
                  {deliveryMethod === 'pickup' ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (8%):</span>
                <span className="text-[#2C3E50]">${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-[#2C3E50]">Total:</span>
                <span className="text-[#C4A672] text-xl">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1"
            >
              Back to Book
            </Button>
            <Button
              onClick={() => setStep('payment')}
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}