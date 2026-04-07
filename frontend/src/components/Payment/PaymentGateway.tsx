import { useState } from 'react';
import { Check, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../../context/CartContext';
import { Alert } from '../ui/alert';

interface PaymentGatewayProps {
  amount: number;
  type: 'buy' | 'rent';
  itemTitle: string;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
  cartItems?: CartItem[];
}

export function PaymentGateway({ amount, type, itemTitle, onSuccess, onCancel, cartItems }: PaymentGatewayProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const targetUserId = cartItems && cartItems.length > 0 ? cartItems[0].sellerId : 'unknown_seller';
  const totalAmount = amount;

  const handleConfirmOrder = async () => {
    setIsProcessing(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Authentication required.");

      const functions = getFunctions();
      const initiateP2PDeal = httpsCallable(functions, 'initiateP2PDeal');
      
      const payload = {
        amount: totalAmount, 
        transactionType: type,
        itemTitle: itemTitle,
        targetUserId: targetUserId,
        cartItems: cartItems ? cartItems.map(i => ({ id: i.id, sellerId: i.sellerId, price: i.price })) : []
      };

      const response: any = await initiateP2PDeal(payload);
      const { transactionId } = response.data;
      
      toast.success('Order Confirmed! Redirecting to chat...');

      const chatId = [user.uid, targetUserId].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [user.uid, targetUserId],
          createdAt: serverTimestamp(),
          lastMessage: `Automated: P2P Deal Initiated for ${itemTitle}`,
          lastMessageTimestamp: serverTimestamp()
        });
      }

      // Add automated initial message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'system',
        text: `A new P2P Deal has been initiated for "${itemTitle}". Amount due: Rs. ${totalAmount.toLocaleString()}. Please process the payment.`,
        createdAt: serverTimestamp()
      });

      onSuccess(transactionId);
      navigate('/chat', {
        state: {
          otherUser: {
             id: targetUserId,
             name: 'Seller',
             avatar: 'S',
             online: true
          }
        }
      });

    } catch (error: any) {
      console.error("Deal initialization anomaly:", error);
      toast.error(error.message || "Failed to initialize P2P Deal.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2C3E50] to-[#34495E] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Order Confirmation</h2>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Order Processing</span>
          </div>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 relative overflow-hidden">
            <h3 className="text-[#2C3E50] mb-3 relative z-10 font-medium">Order Overview</h3>
            <div className="flex justify-between items-center mb-2 relative z-10 text-sm">
              <span className="text-gray-600">{itemTitle}</span>
              <span className="text-[#2C3E50] font-medium">Rs. {amount.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between items-center relative z-10">
              <span className="text-[#2C3E50] font-semibold text-lg">Total Amount Due</span>
              <span className="text-[#C4A672] text-xl font-bold">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <Alert className="mb-6 bg-[#C4A672]/10 border-[#C4A672]/20">
            Confirming your order will notify the seller and initiate a direct communication channel. All payments and handovers are to be coordinated directly between you and the seller.
          </Alert>
        </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
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
              onClick={handleConfirmOrder}
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
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Order
                </>
              )}
            </Button>
          </div>
      </Card>
    </div>
  );
}
