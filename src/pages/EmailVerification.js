// src/pages/EmailVerification.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Logo from '../components/layout/Logo';

const EmailVerification = () => {
  const { currentUser, logout, checkEmailVerification, resendVerificationEmail } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const navigate = useNavigate();

  // Check verification status every few seconds
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const checkVerification = async () => {
      setVerifying(true);
      try {
        const isVerified = await checkEmailVerification();
        if (isVerified) {
          setEmailVerified(true);
          toast.success('Email verified successfully!');
          // Navigate to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      } finally {
        setVerifying(false);
      }
    };

    // Check immediately
    checkVerification();
    
    // Then check periodically
    const intervalId = setInterval(checkVerification, 10000); // Check every 10 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [currentUser, navigate, checkEmailVerification]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error('Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return null; // The useEffect will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="large" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Verify Your Email
        </h2>
        {emailVerified ? (
          <div className="mt-2 text-center text-sm text-gray-600">
            <div className="bg-green-100 p-4 rounded-lg mt-4">
              <p className="text-green-700">Your email has been verified successfully!</p>
              <p className="mt-2">Redirecting to dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-center text-sm text-gray-600">
            <p>We've sent a verification email to:</p>
            <p className="font-medium text-blue-600 mt-1">{currentUser.email}</p>
            <p className="mt-4">Please check your inbox and click the verification link to activate your account.</p>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!emailVerified && (
            <>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleResendEmail}
                  disabled={resending || verifying}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    resending ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {resending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
              
              {verifying && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  <svg className="animate-spin h-5 w-5 mx-auto text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-2">Checking verification status...</p>
                </div>
              )}
              
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Help & Information
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 text-sm text-gray-500">
                  <p>If you don't see the email, check your spam folder.</p>
                  <p className="mt-2">Make sure you're using the correct email address.</p>
                  <p className="mt-2">The verification link may take a few minutes to arrive.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;