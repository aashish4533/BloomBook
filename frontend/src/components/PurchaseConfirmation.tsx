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

  const handlePurchase = () => {
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2000);
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
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
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

                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'paypal' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
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

                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'bank' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
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
                onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
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
              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                deliveryMethod === 'shipping' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
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
                    <Input placeholder="Street Address" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="City" />
                      <Input placeholder="State" />
                    </div>
                    <Input placeholder="ZIP Code" />
                  </div>
                )}
              </div>

              <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                deliveryMethod === 'pickup' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Pickup location and details will be shared after purchase
                    </div>
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