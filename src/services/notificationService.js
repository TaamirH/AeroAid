// File: src/services/notificationService.js
// Enhanced notification service with email support

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
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { calculateDistance } from "../utils/geoUtils";
import { sendEmergencyNotificationEmail, sendTestEmail } from "./emailService";

export const createTestNotification = async (userId, emergencyId, includeEmail = false) => {
  try {
    const testEmergencyId = emergencyId || "test-emergency-id-" + Date.now();

    // Create in-app notification
    const notificationRef = await addDoc(collection(db, "notifications"), {
      userId,
      emergencyId: testEmergencyId,
      title: "Test Emergency Notification",
      message:
        "This is a test notification to verify the notification system is working correctly.",
      read: false,
      createdAt: serverTimestamp(),
      emailSent: false,
    });

    console.log(
      "Created test notification with ID:",
      notificationRef.id,
      "for user:",
      userId
    );

    // Send test email if requested
    if (includeEmail) {
      try {
        // Get user details for email
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.email) {
            const emailResult = await sendTestEmail(userData.email, userData.displayName);
            
            if (emailResult.success) {
              // Update notification to mark email as sent
              await updateDoc(notificationRef, {
                emailSent: true,
                emailSentAt: serverTimestamp(),
              });
              
              console.log("Test email sent successfully to:", userData.email);
              return { 
                success: true, 
                notificationId: notificationRef.id,
                emailSent: true
              };
            } else {
              console.error("Failed to send test email:", emailResult.error);
              return { 
                success: true, 
                notificationId: notificationRef.id,
                emailSent: false,
                emailError: emailResult.error
              };
            }
          } else {
            console.warn("User has no email address for test email");
            return { 
              success: true, 
              notificationId: notificationRef.id,
              emailSent: false,
              emailError: "No email address found"
            };
          }
        }
      } catch (emailError) {
        console.error("Error sending test email:", emailError);
        return { 
          success: true, 
          notificationId: notificationRef.id,
          emailSent: false,
          emailError: emailError.message
        };
      }
    }

    return { 
      success: true, 
      notificationId: notificationRef.id,
      emailSent: includeEmail ? false : null
    };
  } catch (error) {
    console.error("Error creating test notification:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Get user's notifications with email status
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
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        emailSentAt: data.emailSentAt?.toDate(),
      });
    });

    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
};

// Subscribe to real-time notifications with email status
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
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        emailSentAt: data.emailSentAt?.toDate(),
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
      readAt: serverTimestamp(),
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
          readAt: serverTimestamp(),
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

// FIXED: Function to notify a SINGLE operator of nearby emergencies (for dashboard check)
export const notifyOperatorOfNearbyEmergencies = async (
  operatorId,
  operatorLocation,
  sendEmail = true
) => {
  try {
    if (!operatorId || !operatorLocation) {
      console.error("Missing operatorId or location for notification");
      return { success: false, count: 0, emailCount: 0 };
    }

    // Get operator details for email
    const operatorRef = doc(db, "users", operatorId);
    const operatorSnap = await getDoc(operatorRef);
    
    if (!operatorSnap.exists()) {
      console.error("Operator not found:", operatorId);
      return { success: false, count: 0, emailCount: 0 };
    }
    
    const operatorData = operatorSnap.data();

    // Get all active emergencies that don't have an assigned operator
    const emergenciesRef = collection(db, "emergencies");
    const q = query(
      emergenciesRef,
      where("status", "in", ["active", "in-progress"]),
      where("operatorId", "==", null)
    );

    const emergencySnapshot = await getDocs(q);
    let notificationCount = 0;
    let emailCount = 0;

    const nearbyEmergencies = [];

    emergencySnapshot.forEach((doc) => {
      const emergency = { id: doc.id, ...doc.data() };

      if (!emergency.location) return;

      const distance = calculateDistance(
        operatorLocation.latitude,
        operatorLocation.longitude,
        emergency.location.latitude,
        emergency.location.longitude
      );

      if (distance <= 3) {
        nearbyEmergencies.push({
          ...emergency,
          distance,
          createdAt: emergency.createdAt?.toDate()
        });
      }
    });

    console.log(
      `Found ${nearbyEmergencies.length} nearby unassigned emergencies for operator ${operatorId}`
    );

    // Create notifications and send emails for each nearby emergency
    const notificationPromises = [];
    const emailPromises = [];

    for (const emergency of nearbyEmergencies) {
      // Check if notification already exists for this specific operator and emergency
      const existingNotificationsRef = collection(db, "notifications");
      const existingQuery = query(
        existingNotificationsRef,
        where("userId", "==", operatorId),
        where("emergencyId", "==", emergency.id)
      );

      const existingNotifications = await getDocs(existingQuery);

      if (existingNotifications.empty) {
        const shortEmergencyId = emergency.id.substring(0, 8);

        // Create in-app notification
        const notificationPromise = addDoc(collection(db, "notifications"), {
          userId: operatorId,
          emergencyId: emergency.id,
          title: `${emergency.type} Emergency Nearby`,
          message: `Emergency #${shortEmergencyId} is ${emergency.distance.toFixed(
            2
          )}km from your location. Your help is needed!`,
          read: false,
          createdAt: serverTimestamp(),
          emailSent: false,
        }).then((notificationRef) => {
          console.log(
            `Created notification ${notificationRef.id} for operator ${operatorId} about emergency ${emergency.id}`
          );
          notificationCount++;
          return notificationRef;
        });

        notificationPromises.push(notificationPromise);

        // Send email notification if requested and operator has email
        if (sendEmail && operatorData.email) {
          const emailPromise = sendEmergencyNotificationEmail(
            { ...operatorData, id: operatorId, distance: emergency.distance },
            emergency
          ).then(async (result) => {
            if (result.success) {
              console.log(`Email sent successfully to ${operatorData.email}`);
              emailCount++;

              // Update notification to mark email as sent
              const notificationRef = await notificationPromise;
              await updateDoc(notificationRef, {
                emailSent: true,
                emailSentAt: serverTimestamp(),
              });

              return { success: true, email: operatorData.email };
            } else {
              console.error(
                `Failed to send email to ${operatorData.email}:`,
                result.error
              );
              return {
                success: false,
                email: operatorData.email,
                error: result.error,
              };
            }
          });

          emailPromises.push(emailPromise);
        }
      }
    }

    // Wait for all notifications
    await Promise.all(notificationPromises);

    // Wait for all emails if any were sent
    if (emailPromises.length > 0) {
      const emailResults = await Promise.allSettled(emailPromises);
      const successfulEmails = emailResults.filter(
        (result) =>
          result.status === "fulfilled" && result.value.success
      ).length;

      console.log(
        `Email summary for operator ${operatorId}: ${successfulEmails} emails sent successfully`
      );
    }

    return { 
      success: true, 
      count: notificationCount, 
      emailCount: emailCount 
    };
  } catch (error) {
    console.error("Error notifying operator of nearby emergencies:", error);
    return { 
      success: false, 
      error: error.message, 
      count: 0, 
      emailCount: 0 
    };
  }
};

// Function to resend email notification for a specific notification
export const resendEmailNotification = async (notificationId) => {
  try {
    // Get notification details
    const notificationRef = doc(db, "notifications", notificationId);
    const notificationSnap = await getDoc(notificationRef);
    
    if (!notificationSnap.exists()) {
      throw new Error("Notification not found");
    }
    
    const notification = notificationSnap.data();
    
    // Get user details
    const userRef = doc(db, "users", notification.userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    
    if (!userData.email) {
      throw new Error("User has no email address");
    }
    
    // Get emergency details
    const emergencyRef = doc(db, "emergencies", notification.emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      throw new Error("Emergency not found");
    }
    
    const emergencyData = {
      id: notification.emergencyId,
      ...emergencySnap.data(),
      createdAt: emergencySnap.data().createdAt?.toDate()
    };
    
    // Send email
    const emailResult = await sendEmergencyNotificationEmail(
      { ...userData, id: notification.userId, distance: 0 },
      emergencyData
    );
    
    if (emailResult.success) {
      // Update notification
      await updateDoc(notificationRef, {
        emailSent: true,
        emailSentAt: serverTimestamp(),
        emailResent: true,
        emailResentAt: serverTimestamp()
      });
      
      return { success: true };
    } else {
      throw new Error(emailResult.error);
    }
  } catch (error) {
    console.error("Error resending email notification:", error);
    return { success: false, error: error.message };
  }
};

// Get email notification statistics
export const getEmailNotificationStats = async (userId = null) => {
  try {
    const notificationsRef = collection(db, "notifications");
    let q;
    
    if (userId) {
      q = query(notificationsRef, where("userId", "==", userId));
    } else {
      q = query(notificationsRef);
    }
    
    const querySnapshot = await getDocs(q);
    
    let totalNotifications = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalNotifications++;
      
      if (data.emailSent === true) {
        emailsSent++;
      } else if (data.emailSent === false && data.emailSentAt) {
        emailsFailed++;
      }
    });
    
    return {
      totalNotifications,
      emailsSent,
      emailsFailed,
      emailSuccessRate: totalNotifications > 0 ? (emailsSent / totalNotifications * 100).toFixed(1) : 0
    };
  } catch (error) {
    console.error("Error getting email notification stats:", error);
    throw error;
  }
};