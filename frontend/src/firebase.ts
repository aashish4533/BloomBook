import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Dummy config for emulator (replace with real Firebase config for live)
const firebaseConfig = {
  apiKey: "dummy-key",  // Real: from Firebase console
  authDomain: "localhost",
  projectId: "book-bloom-emulator",
  storageBucket: "default-bucket",
  messagingSenderId: "123456",
  appId: "1:123456:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to local emulators if running locally
if (import.meta.env.DEV || window.location.hostname === 'localhost') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); 
    connectFirestoreEmulator(db, '127.0.0.1', 8080); // Use 127.0.0.1 to avoid warnings
    console.log('Connected to Firebase Emulators (Auth & Firestore)');
  } catch (error) {
    // Emulator already connected or connection failed
    console.warn('Firebase emulator connection:', error);
  }
}

// Providers for social login
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, db, googleProvider, facebookProvider };
// Export more later, e.g., export const db = getFirestore(app);