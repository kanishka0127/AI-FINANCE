import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Debug environment variables
console.log('Environment variables check:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Found' : '❌ Missing',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Found' : '❌ Missing',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL ? '✅ Found' : '❌ Missing',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Found' : '❌ Missing',
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCgJSe6NFVGUhkougEzQe7ziZmyDn5PMjQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gojan-connect.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://gojan-connect-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gojan-connect",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gojan-connect.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1092236467314",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1092236467314:web:5508cb9b19ad73884ff6eb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-CGZMPBG5Q9"
};

console.log('Firebase config:', firebaseConfig);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
