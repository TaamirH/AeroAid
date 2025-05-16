// src/components/auth/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }
  
  // No user, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // User exists but email not verified, redirect to verification page
  if (!currentUser.emailVerified) {
    return <Navigate to="/email-verification" />;
  }
  
  // User is logged in and verified
  return children;
};

export default PrivateRoute;