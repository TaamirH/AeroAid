// File: src/components/notifications/NotificationsList.js
// Fixed database connection test

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { toast } from "react-toastify";

const NotificationsList = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false); // New state to track refresh status

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true); // Set refreshing state
      setError(null);
      console.log("Fetching notifications for user:", userId);

      // Set up the query
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      // Get the notifications
      const querySnapshot = await getDocs(q);
      console.log(`Received ${querySnapshot.size} notifications`);

      const notificationsList = [];
      const notificationsToProcess = [];

      // First, collect all notification data
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsToProcess.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
        });
      });

      // Now check if emergencies associated with notifications still need an operator
      for (const notification of notificationsToProcess) {
        // Only process emergency notifications (those with emergencyId)
        if (notification.emergencyId) {
          try {
            // Get the emergency to check if it has an operator
            const emergencyRef = doc(
              db,
              "emergencies",
              notification.emergencyId
            );
            const emergencySnap = await getDoc(emergencyRef);

            if (emergencySnap.exists()) {
              const emergencyData = emergencySnap.data();

              // Only include notifications for emergencies that are active and don't have an operator
              // Or if the current user is the assigned operator
              if (
                (emergencyData.status === "active" ||
                  emergencyData.status === "in-progress") &&
                (!emergencyData.operatorId ||
                  emergencyData.operatorId === userId)
              ) {
                notificationsList.push(notification);
              }
            } else {
              // If emergency doesn't exist, keep the notification anyway
              notificationsList.push(notification);
            }
          } catch (error) {
            console.error(
              "Error checking emergency status for notification:",
              error
            );
            // If there's an error, include the notification anyway
            notificationsList.push(notification);
          }
        } else {
          // Non-emergency notifications are always included
          notificationsList.push(notification);
        }
      }

      setNotifications(notificationsList);
      toast.success("Notifications refreshed");
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications");
      toast.error("Failed to refresh notifications");
    } finally {
      setRefreshing(false); // Reset refreshing state
    }
  };

  // Set up real-time listener when component mounts
  useEffect(() => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log("Setting up notifications listener for user:", userId);

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // Create the snapshot listener
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        console.log(
          `Received ${querySnapshot.size} notifications in real-time update`
        );

        const notificationsList = [];
        const notificationsToProcess = [];

        // First, collect all notification data
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notificationsToProcess.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
          });
        });

        // Now check if emergencies associated with notifications still need an operator
        for (const notification of notificationsToProcess) {
          // Only process emergency notifications (those with emergencyId)
          if (notification.emergencyId) {
            try {
              // Get the emergency to check if it has an operator
              const emergencyRef = doc(
                db,
                "emergencies",
                notification.emergencyId
              );
              const emergencySnap = await getDoc(emergencyRef);

              if (emergencySnap.exists()) {
                const emergencyData = emergencySnap.data();

                // Only include notifications for emergencies that are active and don't have an operator
                // Or if the current user is the assigned operator
                if (
                  (emergencyData.status === "active" ||
                    emergencyData.status === "in-progress") &&
                  (!emergencyData.operatorId ||
                    emergencyData.operatorId === userId)
                ) {
                  notificationsList.push(notification);
                }
              } else {
                // If emergency doesn't exist, keep the notification anyway
                notificationsList.push(notification);
              }
            } catch (error) {
              console.error(
                "Error checking emergency status for notification:",
                error
              );
              // If there's an error, include the notification anyway
              notificationsList.push(notification);
            }
          } else {
            // Non-emergency notifications are always included
            notificationsList.push(notification);
          }
        }

        setNotifications(notificationsList);
        setLoading(false);
      },
      (err) => {
        console.error("Error in notifications listener:", err);
        setError(err.message || "Failed to load notifications");
        setLoading(false);
      }
    );

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [userId]);

  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((note) =>
        note.id === notificationId ? { ...note, read: true } : note
      )
    );
  };

  // Manual refresh function
  const handleRefresh = (e) => {
    e.preventDefault(); // Prevent default behavior (page refresh)
    fetchNotifications(); // Call our fetch function
  };

  if (loading && !refreshing) {
    // Don't show loading indicator during refresh
    return (
      <div className="p-4 text-center">
        <p>Loading notifications...</p>
        <div className="text-xs text-gray-500 mt-2">
          User ID: {userId || "not set"}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
        <div className="mt-4 p-2 bg-gray-100 rounded text-left text-xs">
          <p className="font-bold mb-1">Debug Info:</p>
          <p>User ID: {userId}</p>
          <p>Error: {error}</p>
          <p>Time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold text-lg">
          Notifications
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </h3>
        <button
          onClick={handleRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
          disabled={refreshing}
        >
          {refreshing ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Refreshing...
            </span>
          ) : (
            "Refresh"
          )}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <Link
                  to={`/emergency/${notification.emergencyId}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="block"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          !notification.read ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      ></div>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt?.toLocaleString() ||
                          "Unknown time"}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;
