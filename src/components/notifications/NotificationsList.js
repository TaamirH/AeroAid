// File: src/components/notifications/NotificationsList.js
// Fixed database connection test

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

const NotificationsList = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log('Setting up notifications listener for user:', userId);

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    // Create the snapshot listener
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log(`Received ${querySnapshot.size} notifications in real-time update`);

        const notificationsList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notificationsList.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate()
          });
        });

        setNotifications(notificationsList);
        setLoading(false);
      },
      (err) => {
        console.error('Error in notifications listener:', err);
        setError(err.message || 'Failed to load notifications');
        setLoading(false);
      }
    );

    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, [userId]);

  const handleMarkAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(note =>
        note.id === notificationId ? { ...note, read: true } : note
      )
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p>Loading notifications...</p>
        <div className="text-xs text-gray-500 mt-2">User ID: {userId || 'not set'}</div>
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
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </h3>
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
                className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
              >
                <Link
                  to={`/emergency/${notification.emergencyId}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="block"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`h-3 w-3 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-500">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt?.toLocaleString() || 'Unknown time'}
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