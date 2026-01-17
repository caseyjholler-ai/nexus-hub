// Import Firebase SDK (v9 modular syntax)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ✅ CORRECTED Firebase Configuration - ALL VALUES HAVE QUOTES
const firebaseConfig = {
  apiKey: "AIzaSyDVhMn9KBwIaSbA10Mm4BHqq9WxSvHdAR8",
  authDomain: "nexus-hub-f7a0f.firebaseapp.com",
  projectId: "nexus-hub-f7a0f",
  storageBucket: "nexus-hub-f7a0f.firebasestorage.app",
  messagingSenderId: "639763820658",
  appId: "1:639763820658:web:9d379f407865d294e1d2eb",
  measurementId: "G-YEKMQ52YG1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Log connection status
console.log('🔥 Firebase initialized successfully:', app.name);
