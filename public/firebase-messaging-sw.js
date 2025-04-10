// Service worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBfKHQoMhVbLrCm8qZ_C_B-ASYNDKPduPE",
  authDomain: "aeroaid-39329.firebaseapp.com",
  projectId: "aeroaid-39329",
  storageBucket: "aeroaid-39329.firebasestorage.app",
  messagingSenderId: "599695382483",
  appId: "1:599695382483:web:71b1acedccee90cb464126",
  measurementId: "G-YDN4VDFRNL"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});