// File: src/services/notificationService.js
// Service for handling notifications
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  addDoc, // You'll also need this for adding documents
  serverTimestamp // Add this if it's missing
} from 'firebase/firestore';
  import { db } from './firebase';
  

  export const createTestNotification = async (userId, emergencyId) => {
    try {
      const testEmergencyId = emergencyId || 'test-emergency-id-' + Date.now();
      
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        userId,
        emergencyId: testEmergencyId,
        title: 'Test Emergency Notification',
        message: 'This is a test notification to verify the notification system is working correctly.',
        read: false,
        createdAt: serverTimestamp()
      });
      
      console.log('Created test notification with ID:', notificationRef.id, 'for user:', userId);
      return true;
    } catch (error) {
      console.error('Error creating test notification:', error);
      return false;
    }
  };
  
  // Get user's unread notifications
  export const getUserNotifications = async (userId) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  };
  
  // Subscribe to real-time notifications
  export const subscribeToNotifications = (userId, callback) => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        });
      });
      
      callback(notifications);
    });
  };
  
  // Mark notification as read
  export const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };
  
  // Mark all notifications as read
  export const markAllNotificationsAsRead = async (userId) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      
      const updatePromises = [];
      querySnapshot.forEach((document) => {
        updatePromises.push(
          updateDoc(doc(db, 'notifications', document.id), {
            read: true
          })
        );
      });
      
      await Promise.all(updatePromises);
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };
