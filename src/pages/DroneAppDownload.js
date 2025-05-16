// src/pages/DroneAppDownload.js
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/layout/Logo';

const DroneAppDownload = () => {
  // Direct link to your APK
  const apkUrl = `${window.location.origin}/aeroaid-drone.apk`;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo size="large" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            AeroAid Drone Operator App
          </h2>
          <p className="mt-2 text-gray-600">
            Download our mobile app for enhanced drone operation functionality
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-5">
              <h3 className="text-lg font-medium text-gray-900">Download Information</h3>
              <p className="mt-2 text-sm text-gray-500">
                Version 1.0.0 • Updated May 2025 • 75MB
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-md font-medium">Key Features:</h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Real-time emergency alerts and notifications</li>
                <li>GPS navigation to emergency locations</li>
                <li>Live drone control during search operations</li>
                <li>Offline maps for remote areas</li>
                <li>Direct communication with emergency requesters</li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <a
                href={apkUrl}
                download="AeroAid-Drone.apk"
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download APK
              </a>
              
              <p className="text-xs text-gray-500 text-center">
                For Android devices only. You may need to allow installation from unknown sources in your device settings.
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Having trouble? <a href="mailto:taamirhd@gmail.com" className="text-blue-600 hover:text-blue-800">Contact Support</a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DroneAppDownload;