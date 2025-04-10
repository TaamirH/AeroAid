import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">AeroAid</h1>
        <p className="text-xl md:text-2xl mb-8">Crowdsourced emergency response with the power of drones</p>
        
        {currentUser ? (
          <div className="space-x-4">
            <Link
              to="/dashboard"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/emergency"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Report Emergency
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Register
            </Link>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Quick Response</h2>
          <p>
            In emergency situations, time is critical. AeroAid connects people in need with drone operators in their vicinity, enabling faster search and rescue operations.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Crowdsourced Help</h2>
          <p>
            Leverage the power of community by connecting with nearby drone operators who can assist in emergency situations, extending the reach of traditional emergency services.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Real-time Coordination</h2>
          <p>
            Coordinate search efforts in real-time with live tracking of drone locations, search areas, and findings to maximize efficiency and response time.
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-8 rounded-lg shadow-inner mb-16">
        <h2 className="text-2xl font-bold mb-4 text-center">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-lg">1</span>
            </div>
            <h3 className="font-bold mb-2">Report Emergency</h3>
            <p>Submit an emergency request with your location and details about the situation.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-lg">2</span>
            </div>
            <h3 className="font-bold mb-2">Alert Drone Operators</h3>
            <p>Nearby drone operators are notified of your emergency request.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-lg">3</span>
            </div>
            <h3 className="font-bold mb-2">Coordinate Search</h3>
            <p>Operators are assigned search areas to efficiently cover the area.</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="font-bold text-lg">4</span>
            </div>
            <h3 className="font-bold mb-2">Provide Assistance</h3>
            <p>Findings are reported in real-time to help coordinate emergency response.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;