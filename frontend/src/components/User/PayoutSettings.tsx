import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert } from '../ui/alert';

export const PayoutSettings: React.FC = () => {
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [iban, setIban] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'users', auth.currentUser.uid, 'payoutDetails', 'primary');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBankName(docSnap.data().bankName);
        setAccountTitle(docSnap.data().accountTitle);
        setIban(docSnap.data().iban);
      }
    };
    fetchDetails();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    // Basic IBAN validation (PK followed by 2 digits and 4 chars)
    if (!iban.startsWith('PK') || iban.length < 24) {
      setMessage('Invalid Pakistani IBAN format.');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'payoutDetails', 'primary'), {
        bankName,
        accountTitle,
        iban,
        updatedAt: new Date().toISOString()
      });
      setMessage('Payout details securely saved!');
    } catch (error) {
      setMessage('Error saving details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-xl font-semibold mb-4">Receiving Account Details</h2>
      <p className="text-sm text-gray-500 mb-4">
        Sellers, Lenders, and Tutors must add a valid bank account to receive funds from BookBloom.
      </p>
      {message && <Alert className="mb-4">{message}</Alert>}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label>Bank Name</Label>
          <Input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., Meezan Bank, HBL" />
        </div>
        <div>
          <Label>Account Title</Label>
          <Input required value={accountTitle} onChange={e => setAccountTitle(e.target.value)} placeholder="Exact name on account" />
        </div>
        <div>
          <Label>IBAN</Label>
          <Input required value={iban} onChange={e => setIban(e.target.value.toUpperCase())} placeholder="PK00MEZN00000000000000" />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Securely Save Details'}
        </Button>
      </form>
    </div>
  );
};
