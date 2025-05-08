//src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import EmergencyRequest from './pages/EmergencyRequest';
import EmergencyDetails from './pages/EmergencyDetails';
import Dashboard from './pages/Dashboard';
import SearchAssignment from './pages/SearchAssignment';
import DesignSystem from './pages/DesignSystem';

function App() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/emergency" element={<PrivateRoute><EmergencyRequest /></PrivateRoute>} />
          <Route path="/emergency/:id" element={<PrivateRoute><EmergencyDetails /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/search/:id" element={<PrivateRoute><SearchAssignment /></PrivateRoute>} />
          <Route path="/design-system" element={<DesignSystem />} />        
        </Routes>
      </div>
      <ToastContainer position="bottom-right" />
    </>
  );
}

export default App;
