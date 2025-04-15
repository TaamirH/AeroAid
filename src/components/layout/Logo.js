// src/components/layout/Logo.js
import React from 'react';

const Logo = ({ size = 'medium', color = 'primary' }) => {
  const getSize = () => {
    switch(size) {
      case 'small': return 'h-8';
      case 'large': return 'h-16';
      default: return 'h-12';
    }
  };
  
  const getColor = () => {
    switch(color) {
      case 'white': return 'text-white';
      case 'black': return 'text-black';
      default: return 'text-blue-600';
    }
  };
  
  return (
    <div className={`flex items-center ${getColor()}`}>
      <svg 
        className={`${getSize()} mr-2`}
        viewBox="0 0 64 64" 
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
      >
        <path d="M32 5.333c-14.912 0-27 12.088-27 27 0 14.912 12.088 27 27 27 14.912 0 27-12.088 27-27 0-14.912-12.088-27-27-27zm0 4c12.703 0 23 10.297 23 23 0 12.703-10.297 23-23 23-12.703 0-23-10.297-23-23 0-12.703 10.297-23 23-23z" />
        <path d="M32 16c-1.645 0-3 1.355-3 3v13.47l-8.726 8.726c-1.17 1.17-1.17 3.073 0 4.243 1.17 1.17 3.073 1.17 4.243 0L33.5 36.456c.432-.431.68-1.01.68-1.616V19c0-1.645-1.355-3-3-3z" />
        <path d="M44.243 20.05a1.5 1.5 0 10-2.121 2.122A9.931 9.931 0 0146 30a9.931 9.931 0 01-3.878 7.828 1.5 1.5 0 102.121 2.122A12.922 12.922 0 0049 30c0-3.44-1.343-6.676-3.757-9.95z" />
        <path d="M48.899 15.393a1.5 1.5 0 10-2.121 2.122A17.928 17.928 0 0154 30c0 4.744-1.846 9.21-5.222 12.485a1.5 1.5 0 002.121 2.122A20.921 20.921 0 0057 30c0-5.542-2.155-10.757-6.101-14.607z" />
      </svg>
      <span className="font-bold text-2xl tracking-tight">AeroAid</span>
    </div>
  );
};

export default Logo;