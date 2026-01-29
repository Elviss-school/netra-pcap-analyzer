// src/firebase.js (COMPLETE CORRECTED FILE)

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBqW-ri72TLyfB76zXP8_RHfFfhSuh9PX8",
  authDomain: "netra-test-c3b95.firebaseapp.com",
  databaseURL: "https://netra-test-c3b95-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "netra-test-c3b95",
  storageBucket: "netra-test-c3b95.firebasestorage.app",
  messagingSenderId: "352211121830",
  appId: "1:352211121830:web:65a4ff2198df7efc406667"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const database = getDatabase(app);
export const auth = getAuth(app);
export default app;
export const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds