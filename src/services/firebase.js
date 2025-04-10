// File: src/services/firebase.js
// Firebase configuration and service initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfKHQoMhVbLrCm8qZ_C_B-ASYNDKPduPE",
  authDomain: "aeroaid-39329.firebaseapp.com",
  projectId: "aeroaid-39329",
  storageBucket: "aeroaid-39329.firebasestorage.app",
  messagingSenderId: "599695382483",
  appId: "1:599695382483:web:71b1acedccee90cb464126",
  measurementId: "G-YDN4VDFRNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);
let messaging = null;

// Initialize Firebase Cloud Messaging (only in browser environment)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Error initializing messaging:', error);
  }
}

// Request permission for notifications
export const requestNotificationPermission = async () => {
  if (!messaging) return false;
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Use the VAPID key from your Firebase project
      const token = await getToken(messaging, {
        vapidKey: 'BDQ7r27gp7jyiSYnM_KbnBT1it8KsK1cUgCnNonhPAAhDaSdU5KejCR6uVW9Fp2soha5-qbpCYRO42h4VsrQTr8',
      });
      
      return token;
    }
    return false;
  } catch (error) {
    console.error('Notification permission error:', error);
    return false;
  }
};

// Handle incoming messages
export const onMessageListener = () => {
  if (!messaging) return Promise.resolve();
  
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export { app, auth, db, storage, messaging, analytics };