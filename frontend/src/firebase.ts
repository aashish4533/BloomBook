import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Added getStorage for completeness

// ----------------------------------------------------
// PASTE YOUR REAL CONFIGURATION OBJECT HERE:
// Replace the contents of this object with the config you copied from the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyDFRufOWCuGDKfKffacZXgQWdGG7RJzIQI",
  authDomain: "bookbloom-5429e.firebaseapp.com",
  databaseURL: "https://bookbloom-5429e-default-rtdb.firebaseio.com",
  projectId: "bookbloom-5429e",
  storageBucket: "bookbloom-5429e.firebasestorage.app",
  messagingSenderId: "322581834006",
  appId: "1:322581834006:web:979f691da2d0a2cd7d0837",
  measurementId: "G-93D0YZERSQ"
};
// ----------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Initialize Storage

// REMOVED: Emulator connection code. The app will now connect to the live project.

// Providers for social login
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Export all necessary services
export { auth, db, storage, googleProvider, facebookProvider };