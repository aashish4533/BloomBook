import { useState, useEffect } from 'react';
import { Check, AlertCircle, X, ShieldCheck, Banknote } from 'lucide-react';
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
  const [sellerDetails, setSellerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const navigate = useNavigate();

  const targetUserId = cartItems && cartItems.length > 0 ? cartItems[0].sellerId : 'unknown_seller';
  const totalAmount = amount;

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        if (targetUserId === 'unknown_seller') {
            setLoadingDetails(false);
            return;
        }
        const payoutRef = doc(db, 'users', targetUserId, 'payoutDetails', 'primary');
        const payoutSnap = await getDoc(payoutRef);
        if (payoutSnap.exists()) {
          setSellerDetails(payoutSnap.data());
        }
      } catch (err) {
        console.error("Error fetching seller details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchSellerDetails();
  }, [targetUserId]);

  const handleStartDeal = async () => {
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
      
      toast.success('P2P Deal Locked! Redirecting to chat...');

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
             name: sellerDetails?.accountTitle || 'Seller',
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
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">P2P Deal Initialization</h2>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white/90 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Manual Escrow Protection System</span>
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

          <Alert className="mb-6 bg-blue-50 border-blue-200">
            You are about to start a direct Peer-to-Peer deal. BookBloom holds the transaction record, but you will manually transfer funds directly to the seller's account shown below.
          </Alert>

          {/* Seller Details */}
          <div className="mb-6">
             <h3 className="text-[#2C3E50] font-medium mb-3 flex items-center gap-2">
                 <Banknote className="w-5 h-5 text-[#C4A672]" /> 
                 Seller Receiving Account
             </h3>
             {loadingDetails ? (
                 <div className="p-4 bg-gray-50 rounded animate-pulse text-gray-500 text-sm">Loading security details...</div>
             ) : sellerDetails ? (
                 <div className="p-4 bg-[#C4A672]/5 border border-[#C4A672]/30 rounded-lg">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Bank / Service:</span>
                            <span className="font-medium text-[#2C3E50]">{sellerDetails.bankName || 'Unknown Bank'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Account Title:</span>
                            <span className="font-medium text-[#2C3E50]">{sellerDetails.accountTitle || 'Unknown Title'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Account Number:</span>
                            <span className="font-mono text-[#2C3E50] bg-white px-2 py-1 border rounded">{sellerDetails.accountNumber || 'N/A'}</span>
                        </div>
                    </div>
                 </div>
             ) : (
                 <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-start gap-2">
                     <AlertCircle className="w-5 h-5 shrink-0" />
                     <span>This seller has not configured a payout account. Please ask them to update their settings first or you will not be able to proceed safely.</span>
                 </div>
             )}
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
              onClick={handleStartDeal}
              className="flex-1 bg-[#C4A672] hover:bg-[#8B7355] text-white"
              disabled={isProcessing || !sellerDetails || loadingDetails}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Locking Deal...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Acknowledge & Start Deal
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
