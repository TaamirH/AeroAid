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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
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
      if (refreshing) {
        toast.success("Notifications refreshed");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to load notifications");
      if (refreshing) {
        toast.error("Failed to refresh notifications");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Get the count of unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Single blue header with bell icon and refresh button */}
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <h2 className="font-bold text-lg flex items-center">
          <svg
            className="h-5 w-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <button
          onClick={handleRefresh}
          className="text-sm text-white hover:text-blue-200 focus:outline-none"
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Notifications list */}
      <div className="max-h-80 overflow-y-auto">
        {loading && !refreshing ? (
          <div className="p-4 text-center">
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
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
