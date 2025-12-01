import { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, Check, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface PaymentGatewayProps {
  amount: number;
  type: 'buy' | 'rent' | 'tuition';
  itemTitle: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function PaymentGateway({ amount, type, itemTitle, onSuccess, onCancel }: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.replace('/', '').length <= 4) {
      setExpiryDate(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCvv(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (paymentMethod === 'card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardName.trim()) {
        toast.error('Please enter the cardholder name');
        return;
      }
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        toast.error('Please enter a valid expiry date (MM/YY)');
        return;
      }
      // Check if expiry date is in the future
      const [expMonth, expYear] = expiryDate.split('/').map(Number);
      const now = new Date();
      const currentYear = parseInt(now.getFullYear().toString().slice(-2));
      const currentMonth = now.getMonth() + 1;

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        toast.error('Card has expired');
        return;
      }

      if (!cvv || cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(async () => {
      const txId = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setTransactionId(txId);

      // Save purchase to Firestore
      try {
        const user = auth.currentUser;
        if (user) {
          const purchaseRef = await addDoc(collection(db, 'purchases'), {
            userId: user.uid,
            bookTitle: itemTitle,
            price: amount,
            date: new Date().toISOString(),
            status: 'completed',
            transactionId: txId,
            type: type,
            createdAt: serverTimestamp()
          });

          // Also save to transactions collection for Admin Dashboard
          await addDoc(collection(db, 'transactions'), {
            type: type === 'rent' ? 'rent' : 'buy', // Map 'tuition' to 'buy' or handle separately if needed
            bookTitle: itemTitle,
            user: user.displayName || user.email || 'Unknown User',
            amount: amount,
            date: new Date().toISOString(),
            status: 'completed',
            relatedId: purchaseRef.id,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error saving purchase:", error);
        // We don't block success UI if saving history fails, but we log it
      }

      setIsProcessing(false);
      setShowSuccess(true);
    }, 2000);
  };

  const handleSuccessClose = () => {
    onSuccess(transactionId);
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-[#2C3E50] text-2xl mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Your transaction has been completed</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="text-[#2C3E50]">{transactionId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Item:</span>
              <span className="text-[#2C3E50]">{itemTitle}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Type:</span>
              <span className="text-[#2C3E50] capitalize">{type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="text-[#C4A672] text-lg">${amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Secure transaction via SSL encryption</span>
          </div>

          <Button
            onClick={handleSuccessClose}
            className="w-full bg-[#C4A672] hover:bg-[#8B7355] text-white"
          >
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl">Secure Checkout</h2>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <Lock className="w-4 h-4" />
            <span>256-bit SSL Encrypted Payment</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-[#2C3E50] mb-3">Order Summary</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">{itemTitle}</span>
              <span className="text-[#2C3E50]">${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Processing Fee</span>
              <span className="text-[#2C3E50]">$0.00</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between items-center">
              <span className="text-[#2C3E50]">Total Amount</span>
              <span className="text-[#C4A672] text-xl">${amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <Label className="mb-3 block">Select Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'card' | 'paypal')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <label htmlFor="card" className="flex items-center gap-3 cursor-pointer">
                    <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-[#C4A672]' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <p className="text-[#2C3E50]">Credit/Debit Card</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard, Amex</p>
                    </div>
                    <img
                      src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='25' viewBox='0 0 40 25'%3E%3Crect fill='%236772E5' width='40' height='25' rx='3'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='10' font-weight='bold'%3EStripe%3C/text%3E%3C/svg%3E"
                      alt="Stripe"
                      className="h-6"
                    />
                  </label>
                </div>
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <RadioGroupItem value="paypal" id="paypal" className="sr-only" />
                  <label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer">
                    <div className="w-6 h-6 bg-[#0070BA] rounded flex items-center justify-center text-white text-xs">
                      P
                    </div>
                    <div className="flex-1">
                      <p className="text-[#2C3E50]">PayPal</p>
                      <p className="text-xs text-gray-500">Fast & Secure</p>
                    </div>
                  </label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Card Details Form */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="pr-10"
                    required
                  />
                  <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={cvv}
                      onChange={handleCvvChange}
                      maxLength={4}
                      required
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PayPal Notice */}
          {paymentMethod === 'paypal' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                You will be redirected to PayPal to complete your payment securely.
              </p>
            </div>
          )}

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-6 my-6 py-4 border-y border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span>SSL Secure</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>PCI Compliant</span>
            </div>
            <Badge variant="outline" className="text-xs">
              <Check className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </div>

          {/* Trust Message */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </form>
      </Card>
    </div>
  );
}
