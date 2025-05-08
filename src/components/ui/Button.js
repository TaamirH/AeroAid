// src/components/ui/Button.js
import React from 'react';

export const Button = ({ 
  children, 
  type = 'primary', 
  size = 'medium',
  onClick,
  disabled = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "font-medium rounded-md focus:outline-none transition-colors";
  
  const typeStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    secondary: "bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 shadow-sm",
    success: "bg-green-600 hover:bg-green-700 text-white shadow-sm",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm",
    text: "text-blue-600 hover:text-blue-800",
  };
  
  const sizeStyles = {
    small: "px-3 py-1 text-sm",
    medium: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };
  
  const disabledStyles = disabled ? "opacity-70 cursor-not-allowed" : "";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${typeStyles[type]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};