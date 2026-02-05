// src/firebase.js (COMPLETE CORRECTED FILE)

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHQGY7CNdeaesg3SRKjBPozucg-KenbuY",
  authDomain: "netra-final.firebaseapp.com",
  databaseURL: "https://netra-final-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "netra-final",
  storageBucket: "netra-final.firebasestorage.app",
  messagingSenderId: "566408689059",
  appId: "1:566408689059:web:5ee48d43393e3bcc19d616",
  measurementId: "G-X46TKZZS8N"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds