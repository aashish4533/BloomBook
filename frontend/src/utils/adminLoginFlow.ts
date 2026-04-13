import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebase';
import { toast } from 'sonner';

export async function ensureAdminUserDocument(user: User, adminEmail: string): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  if (!userDocSnap.exists()) {
    await setDoc(userDocRef, {
      email: adminEmail,
      name: 'Admin',
      role: 'admin',
      createdAt: serverTimestamp(),
      verified: true,
    });
    toast.info('Admin profile restored in database.');
  } else if (userDocSnap.data().role !== 'admin') {
    await auth.signOut();
    throw new Error('This account does not have admin privileges.');
  }
}

export async function callSendAdminEmailOtp(): Promise<void> {
  const sendOtp = httpsCallable(functions, 'sendAdminEmailOtp', { timeout: 60000 });
  await sendOtp({});
}

export async function callVerifyAdminEmailOtp(code: string): Promise<void> {
  const verifyOtp = httpsCallable(functions, 'verifyAdminEmailOtp', { timeout: 30000 });
  await verifyOtp({ code });
}
