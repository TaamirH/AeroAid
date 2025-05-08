// src/components/ui/StatCard.js
import React from 'react';

export const StatCard = ({ title, value, color, textColor, description }) => {
  return (
    <div className={`${color} p-3 rounded-lg text-center`}>
      <p className="text-sm text-gray-700">{title}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

// src/components/ui/EmptyState.js
import React from 'react';

export const EmptyState = ({ icon, title, message, buttonText, onClick }) => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <div className="mx-auto flex items-center justify-center h-12 w-12">
        {icon}
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {buttonText && (
        <div className="mt-6">
          <button
            onClick={onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {buttonText}
          </button>
        </div>
      )}
    </div>
  );
};

