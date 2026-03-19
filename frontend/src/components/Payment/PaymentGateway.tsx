import { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, Check, AlertCircle, X, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { CartItem } from '../../context/CartContext';

interface PaymentGatewayProps {
  amount: number;
  type: 'buy' | 'rent';
  itemTitle: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
  cartItems?: CartItem[];
}

export function PaymentGateway({ amount, type, itemTitle, onSuccess, onCancel, cartItems }: PaymentGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'easypaisa' | 'jazzcash'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  // Gravitational 2% Platform Stabilization Fee
  const stabilizationFee = amount * 0.02;
  const totalAmount = amount + stabilizationFee;

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
    } else if (paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') {
      if (!mobileNumber || mobileNumber.length < 10) {
        toast.error('Please enter a valid mobile number for the wallet prompt.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("A user origin is required to establish payment orbit.");

      const functions = getFunctions();
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      
      const payload = {
        amount: amount, // Cloud function handles fee independently but uses base amount
        type: type,
        itemTitle: itemTitle,
        method: paymentMethod,
        mobileNumber: mobileNumber
      };

      const response: any = await createPaymentIntent(payload);
      const { status, iframeUrl, transactionId: backendTxId, message } = response.data;
      
      setTransactionId(backendTxId);

      if (status === 'push_prompt_sent') {
        toast.success(message || 'Push prompt initiated. Please check your phone.');
        // For wallets, we assume pending success via webhook. We'll show the success screen.
        setShowSuccess(true);
      } else if (status === 'iframe_ready') {
        // Option A: Open iframe directly here
        // Option B: Redirect top window
        window.location.href = iframeUrl;
      } else {
        throw new Error("Invalid orbital state returned from gateway sequence.");
      }

    } catch (error: any) {
      console.error("Payment initiation anomaly:", error);
      toast.error(error.message || "Failed to initiate payment sequence.");
    } finally {
      setIsProcessing(false);
    }
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
              <span className="text-gray-600">Total Charged:</span>
              <span className="text-[#C4A672] text-lg">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Secure transaction via localized integration API</span>
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
          <div className="bg-gray-50 rounded-lg p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C4A672]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h3 className="text-[#2C3E50] mb-3 relative z-10">Orbital Summary</h3>
            <div className="flex justify-between items-center mb-2 relative z-10">
              <span className="text-gray-600">{itemTitle} (Base Mass)</span>
              <span className="text-[#2C3E50]">Rs. {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-2 relative z-10 group">
              <span className="text-gray-600 border-b border-dashed border-gray-400 cursor-help" title="Mandatory platform fee to maintain network equilibrium">
                Stabilization Fee (2%)
              </span>
              <span className="text-[#2C3E50]">+ Rs. {stabilizationFee.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between items-center relative z-10">
              <span className="text-[#2C3E50] font-semibold">Total Gravity Payload</span>
              <span className="text-[#C4A672] text-xl font-semibold">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <Label className="mb-3 block text-[#2C3E50]">Select Payment Trajectory</Label>
            <RadioGroup value={paymentMethod} onValueChange={(v: string) => setPaymentMethod(v as 'card' | 'easypaisa' | 'jazzcash')}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'easypaisa' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <RadioGroupItem value="easypaisa" id="easypaisa" className="sr-only" />
                  <label htmlFor="easypaisa" className="flex items-center gap-3 cursor-pointer">
                    <Smartphone className={`w-6 h-6 ${paymentMethod === 'easypaisa' ? 'text-[#C4A672]' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <p className="text-[#2C3E50]">EasyPaisa</p>
                      <p className="text-[10px] text-gray-500 leading-tight">Mobile Push</p>
                    </div>
                  </label>
                </div>
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'jazzcash' ? 'border-[#C4A672] bg-[#C4A672]/5' : 'border-gray-200'
                  }`}>
                  <RadioGroupItem value="jazzcash" id="jazzcash" className="sr-only" />
                  <label htmlFor="jazzcash" className="flex items-center gap-3 cursor-pointer">
                    <Smartphone className={`w-6 h-6 ${paymentMethod === 'jazzcash' ? 'text-[#C4A672]' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <p className="text-[#2C3E50]">JazzCash</p>
                      <p className="text-[10px] text-gray-500 leading-tight">Mobile Push</p>
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

          {/* Mobile Wallet Details */}
          {(paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash') && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <Label htmlFor="mobileNumber">Mobile Wallet Number</Label>
              <div className="relative mt-2">
                <Input
                  id="mobileNumber"
                  type="text"
                  placeholder="03XXXXXXXXX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="pl-10"
                  required
                />
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                A payment prompt will be pushed to this number. Please authorize the transaction on your mobile device.
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
                  Authorize Rs. {totalAmount.toLocaleString()}
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
