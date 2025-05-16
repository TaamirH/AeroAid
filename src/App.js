// src/App.js
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';
import { useAuth } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification'; // Add this
import Profile from './pages/Profile';
import EmergencyRequest from './pages/EmergencyRequest';
import EmergencyDetails from './pages/EmergencyDetails';
import Dashboard from './pages/Dashboard';
import SearchAssignment from './pages/SearchAssignment';
import VerificationHandler from './pages/VerificationHandler';
import DroneAppDownload from './pages/DroneAppDownload';



function App() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Redirect to verification page if user is logged in but not verified
  useEffect(() => {
    const checkVerification = async () => {
      if (currentUser && !currentUser.emailVerified) {
        const protectedPaths = ['/dashboard', '/profile', '/emergency'];
        
        // Check if the current path is protected and not the verification path
        if (
          protectedPaths.some(path => location.pathname.startsWith(path)) && 
          location.pathname !== '/email-verification'
        ) {
          navigate('/email-verification');
        }
      }
    };
    
    checkVerification();
  }, [currentUser, location.pathname, navigate]);
  
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/verify-email" element={<VerificationHandler />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/emergency" element={<PrivateRoute><EmergencyRequest /></PrivateRoute>} />
          <Route path="/emergency/:id" element={<PrivateRoute><EmergencyDetails /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/search/:id" element={<PrivateRoute><SearchAssignment /></PrivateRoute>} />
          <Route path="/download-app" element={<PrivateRoute><DroneAppDownload /></PrivateRoute>} />

          
        </Routes>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}

export default App;