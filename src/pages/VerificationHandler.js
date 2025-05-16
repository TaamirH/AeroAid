// src/pages/VerificationHandler.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../components/layout/Logo';

const VerificationHandler = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    const checkVerification = async () => {
      // If no user, redirect to login
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        // Force reload to get latest verification status
        await currentUser.reload();
        
        if (currentUser.emailVerified) {
          // Email is verified, show success and redirect
          toast.success("Email verified successfully! Welcome to AeroAid.");
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500); // Short delay to show the toast
        } else {
          // Email still not verified, redirect to verification page
          toast.error("Email verification incomplete. Please check your email.");
          navigate('/email-verification');
        }
      } catch (error) {
        console.error("Error checking verification:", error);
        toast.error("Something went wrong. Please try logging in again.");
        navigate('/login');
      } finally {
        setChecking(false);
      }
    };
    
    checkVerification();
  }, [currentUser, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Logo size="large" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Verifying your email...
        </h2>
        {checking && (
          <div className="mt-4 flex justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationHandler;