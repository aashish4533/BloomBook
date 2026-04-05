import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { AlertCircle, CheckCircle, UploadCloud, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '../ui/alert';

export const P2PAssurancePanel = ({ transactionId }: { transactionId: string }) => {
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  useEffect(() => {
    if (!transactionId) return;
    const unsub = onSnapshot(doc(db, 'transactions', transactionId), (docSnap) => {
      if (docSnap.exists()) {
        setTransaction(docSnap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, [transactionId]);

  if (loading) return null;
  if (!transaction) return null;
  
  const isBuyer = auth.currentUser?.uid === transaction.buyerId;
  const isSeller = auth.currentUser?.uid === transaction.sellerId;
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File excessively large. Limit is 5MB.");
      return;
    }
    
    setIsUploading(true);
    try {
      const storage = getStorage();
      const proofRef = ref(storage, `payment_proofs/${transactionId}/${file.name}`);
      await uploadBytes(proofRef, file);
      const url = await getDownloadURL(proofRef);
      
      const functions = getFunctions();
      const submitProof = httpsCallable(functions, 'submitProofOfPayment');
      await submitProof({ transactionId, proofImageUrl: url });
      
      toast.success("Payment proof securely uploaded.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const functions = getFunctions();
      const verifyPayment = httpsCallable(functions, 'verifyPaymentReceived');
      await verifyPayment({ transactionId });
      toast.success("Deal completely verified and settled.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Verification malfunctioned.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="m-4 overflow-hidden border-2 border-[#C4A672]/30 shadow-sm relative shrink-0">
       {/* Background gradient hint */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-[#C4A672]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
       
       <div className="p-4 relative z-10 flex flex-col gap-4">
           {transaction.status === 'locked_for_payment' && isBuyer && (
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex-1">
                       <h4 className="font-semibold text-[#2C3E50]">Action Required: Transfer Funds</h4>
                       <p className="text-sm text-gray-600">Transfer Rs. {transaction.baseAmount?.toLocaleString()} to the seller and upload your screenshot.</p>
                   </div>
                   <div className="flex shrink-0">
                       <input 
                         type="file" 
                         id={`proof-upload-${transactionId}`} 
                         className="hidden" 
                         accept="image/*" 
                         onChange={handleFileUpload} 
                         disabled={isUploading} 
                       />
                       <label htmlFor={`proof-upload-${transactionId}`}>
                           <Button asChild className="bg-[#C4A672] hover:bg-[#8B7355] cursor-pointer" disabled={isUploading}>
                               <span>
                                   {isUploading ? "Uploading..." : <><UploadCloud className="w-4 h-4 mr-2"/> Upload Proof</>}
                               </span>
                           </Button>
                       </label>
                   </div>
               </div>
           )}
           
           {transaction.status === 'locked_for_payment' && isSeller && (
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                       <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                   </div>
                   <div>
                       <h4 className="font-semibold text-[#2C3E50]">Awaiting Payment</h4>
                       <p className="text-sm text-gray-600">The buyer is securing the funds. You will be notified when proof is uploaded.</p>
                   </div>
               </div>
           )}

           {transaction.status === 'payment_claimed' && isSeller && (
               <div className="flex flex-col gap-4">
                   <Alert className="bg-red-50 border-red-200 text-red-800">
                       <div className="flex items-center">
                           <AlertCircle className="w-4 h-4 mr-2" />
                           <span className="font-semibold">Warning:</span> 
                       </div>
                       <div className="mt-1">
                           Do NOT rely solely on this image. Verify directly within your banking app before confirming.
                       </div>
                   </Alert>
                   
                   <div className="flex gap-4 flex-col sm:flex-row">
                       <a href={transaction.proofUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center w-full sm:w-48 h-32 bg-gray-100 rounded-lg border hover:bg-gray-200 transition-colors">
                           <FileImage className="w-8 h-8 text-gray-400 mb-2" />
                           <span className="text-sm text-gray-600">View Proof</span>
                       </a>
                       
                       <div className="flex flex-col justify-end gap-2 flex-1">
                           <Button onClick={handleVerify} disabled={isVerifying} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-white">
                              {isVerifying ? "Verifying..." : "I Confirm I Received the Funds"}
                           </Button>
                       </div>
                   </div>
               </div>
           )}

           {transaction.status === 'payment_claimed' && isBuyer && (
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                       <CheckCircle className="w-5 h-5" />
                   </div>
                   <div>
                       <h4 className="font-semibold text-[#2C3E50]">Proof Uploaded</h4>
                       <p className="text-sm text-gray-600">Awaiting seller verification. The deal will finalize shortly.</p>
                   </div>
               </div>
           )}

           {transaction.status === 'completed' && (
               <div className="flex flex-col items-center justify-center py-2 text-center text-green-700 bg-green-50 rounded-lg border border-green-200">
                   <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                       <CheckCircle className="w-6 h-6 text-green-600" />
                   </div>
                   <h4 className="font-bold">Deal Completed & Verified</h4>
                   <p className="text-sm opacity-80">Reference: {transactionId}</p>
               </div>
           )}
       </div>
    </Card>
  );
};
