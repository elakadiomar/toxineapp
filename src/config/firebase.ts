import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC6hTMg0ZqvnulzNaVwfNP-9jJH82mn4Co",
  authDomain: "toxine-v3.firebaseapp.com",
  projectId: "toxine-v3",
  storageBucket: "toxine-v3.firebasestorage.app",
  messagingSenderId: "888629978192",
  appId: "1:888629978192:web:01d716f1e4988483a11d55",
  measurementId: "G-QFJJQHKT3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
