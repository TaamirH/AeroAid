// src/components/ui/NotificationItem.js
import React from 'react';

export const NotificationItem = ({ 
  notification, 
  onClick
}) => {
  return (
    <li className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}>
      <button className="block text-left w-full" onClick={onClick}>
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            <div className={`h-3 w-3 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>
          <div className="ml-3">
            <p className="font-semibold text-gray-900">{notification.title}</p>
            <p className="text-sm text-gray-700">{notification.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </button>
    </li>
  );
};