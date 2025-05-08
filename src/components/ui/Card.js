// src/components/ui/Card.js
import React from 'react';

export const Card = ({ 
  title,
  titleColor = "bg-gray-100",
  titleTextColor = "text-gray-800",
  children,
  footer,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 ${className}`}>
      {title && (
        <div className={`${titleColor} px-4 py-3 border-b border-gray-200`}>
          <h3 className={`font-semibold ${titleTextColor}`}>{title}</h3>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};