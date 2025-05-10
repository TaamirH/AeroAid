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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { calculateDistance } from "../utils/geoUtils";

export const createTestNotification = async (userId, emergencyId) => {
  try {
    const testEmergencyId = emergencyId || "test-emergency-id-" + Date.now();

    const notificationRef = await addDoc(collection(db, "notifications"), {
      userId,
      emergencyId: testEmergencyId,
      title: "Test Emergency Notification",
      message:
        "This is a test notification to verify the notification system is working correctly.",
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log(
      "Created test notification with ID:",
      notificationRef.id,
      "for user:",
      userId
    );
    return true;
  } catch (error) {
    console.error("Error creating test notification:", error);
    return false;
  }
};

// Get user's unread notifications
export const getUserNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const notifications = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (userId, callback) => {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

    callback(notifications);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });

    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);

    const updatePromises = [];
    querySnapshot.forEach((document) => {
      updatePromises.push(
        updateDoc(doc(db, "notifications", document.id), {
          read: true,
        })
      );
    });

    await Promise.all(updatePromises);

    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// Function to notify a drone operator about nearby active emergencies
export const notifyOperatorOfNearbyEmergencies = async (
  operatorId,
  operatorLocation
) => {
  try {
    if (!operatorId || !operatorLocation) {
      console.error("Missing operatorId or location for notification");
      return { success: false, count: 0 };
    }

    // Get all active emergencies that don't have an assigned operator
    const emergenciesRef = collection(db, "emergencies");
    const q = query(
      emergenciesRef,
      where("status", "in", ["active", "in-progress"]),
      where("operatorId", "==", null) // Only get emergencies without an operator
    );

    const emergencySnapshot = await getDocs(q);
    let notificationCount = 0;

    // Check each emergency and create notifications for those within range
    const nearbyEmergencies = [];

    emergencySnapshot.forEach((doc) => {
      const emergency = { id: doc.id, ...doc.data() };

      // Skip if no location
      if (!emergency.location) return;

      // Calculate distance
      const distance = calculateDistance(
        operatorLocation.latitude,
        operatorLocation.longitude,
        emergency.location.latitude,
        emergency.location.longitude
      );

      // If within 3km, add to nearby emergencies
      if (distance <= 3) {
        nearbyEmergencies.push({
          ...emergency,
          distance,
        });
      }
    });

    console.log(
      `Found ${nearbyEmergencies.length} nearby unassigned emergencies for operator ${operatorId}`
    );

    // Create notifications for each nearby emergency
    for (const emergency of nearbyEmergencies) {
      // First check if a notification already exists for this operator and emergency
      const existingNotificationsRef = collection(db, "notifications");
      const existingQuery = query(
        existingNotificationsRef,
        where("userId", "==", operatorId),
        where("emergencyId", "==", emergency.id)
      );

      const existingNotifications = await getDocs(existingQuery);

      // If no notification exists, create one
      if (existingNotifications.empty) {
        const shortEmergencyId = emergency.id.substring(0, 8);

        await addDoc(collection(db, "notifications"), {
          userId: operatorId,
          emergencyId: emergency.id,
          title: `${emergency.type} Emergency Nearby`,
          message: `Emergency #${shortEmergencyId} is ${emergency.distance.toFixed(
            2
          )}km from your location. Your help is needed!`,
          read: false,
          createdAt: serverTimestamp(),
        });

        notificationCount++;
        console.log(
          `Created notification for operator ${operatorId} about emergency ${emergency.id}`
        );
      }
    }

    return { success: true, count: notificationCount };
  } catch (error) {
    console.error("Error notifying operator of nearby emergencies:", error);
    return { success: false, error: error.message };
  }
};
