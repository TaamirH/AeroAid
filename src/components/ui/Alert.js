// src/components/ui/Alert.js
import React from 'react';

export const Alert = ({ 
  type = 'info', 
  title, 
  children,
  icon, 
  dismissible = false,
  onDismiss
}) => {
  const typeStyles = {
    info: "bg-blue-50 border-blue-500 text-blue-700",
    success: "bg-green-50 border-green-500 text-green-700",
    warning: "bg-yellow-50 border-yellow-500 text-yellow-700",
    error: "bg-red-50 border-red-500 text-red-700",
  };
  
  const iconColors = {
    info: "text-blue-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    error: "text-red-400",
  };
  
  return (
    <div className={`${typeStyles[type]} border-l-4 p-4 rounded-r`}>
      <div className="flex">
        {icon && (
          <div className="flex-shrink-0">
            <div className={`h-5 w-5 ${iconColors[type]}`}>
              {icon}
            </div>
          </div>
        )}
        <div className={`${icon ? 'ml-3' : ''} flex-1`}>
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 ${iconColors[type]} hover:bg-${type}-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-500`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};