// src/components/auth/AccountRecoveryHelper.js
// Simplified component that focuses on existing email scenarios

import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { toast } from 'react-toastify';

const AccountRecoveryHelper = ({ email, onRecoveryComplete }) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const resetPassword = async () => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox.');
      setEmailSent(true);
    } catch (error) {
      console.error('Error sending password reset:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email address.');
      } else {
        toast.error('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const proceedWithRegistration = () => {
    onRecoveryComplete('proceed');
  };

  const tryLogin = () => {
    onRecoveryComplete('login');
  };

  if (!email) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 20c-.77-1.333-2.694-1.333-3.464 0L3.34 7c-.77-1.333.192-3 1.732-3z"></path>
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 text-center mt-4">
            Email Already Exists
          </h3>
          
          <div className="mt-4 text-center">
            {!emailSent ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  An account with email <strong>{email}</strong> already exists.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={tryLogin}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={resetPassword}
                    disabled={loading}
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Reset Password'}
                  </button>
                  <button
                    onClick={proceedWithRegistration}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Try Different Email
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Password reset email sent to <strong>{email}</strong>. 
                  Check your inbox and follow the instructions.
                </p>
                <button
                  onClick={tryLogin}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => onRecoveryComplete('cancel')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountRecoveryHelper;