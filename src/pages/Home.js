// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/layout/Logo';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1508444845599-5c89863b1c44?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Drone in sky" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/80 to-gray-900/60"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-8">
            <Logo size="large" color="white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Emergency Drone Response
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
            Crowdsourced emergency response with the power of drones. Connect people in need with nearby drone operators for faster assistance.
          </p>
          
          <div className="mt-10">
            {currentUser ? (
              <div className="space-x-4">
                <Link
                  to="/dashboard"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/emergency"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
                >
                  Report Emergency
                </Link>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Quick Response</h3>
              <p className="text-gray-600">
                In emergency situations, time is critical. AeroAid connects people in need with drone operators in their vicinity, enabling faster search and rescue operations.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Crowdsourced Help</h3>
              <p className="text-gray-600">
                Leverage the power of community by connecting with nearby drone operators who can assist in emergency situations, extending the reach of traditional emergency services.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Coordination</h3>
              <p className="text-gray-600">
                Coordinate search efforts in real-time with live tracking of drone locations, search areas, and findings to maximize efficiency and response time.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="py-16 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="font-bold text-lg">1</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Report Emergency</h3>
              <p className="text-gray-600">Submit an emergency request with your location and details about the situation.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="font-bold text-lg">2</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Alert Operators</h3>
              <p className="text-gray-600">Nearby drone operators are notified of your emergency request.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="font-bold text-lg">3</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Coordinate Search</h3>
              <p className="text-gray-600">Operators are assigned search areas to efficiently cover the location.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="font-bold text-lg">4</span>
              </div>
              <h3 className="font-bold text-lg mb-2">Provide Assistance</h3>
              <p className="text-gray-600">Findings are reported in real-time to help coordinate emergency response.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
            Success Stories
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="John D."
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-bold">John D.</h4>
                  <p className="text-sm text-gray-500">Lost Hiker Found</p>
                </div>
              </div>
              <p className="text-gray-600">
                "I lost my dog during a hiking trip. Luckily, I had the AeroAid app. Within 30 minutes of sending an alert, a drone operator found the dog and guided rescue services to his location. AeroAid saved my life!"
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="Maria S."
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-bold">Maria S.</h4>
                  <p className="text-sm text-gray-500">Drone Operator</p>
                </div>
              </div>
              <p className="text-gray-600">
                "As a drone enthusiast, AeroAid gives me a way to use my equipment for something meaningful. I've participated in three search operations so far, and the feeling of helping someone in need is incredible. The platform makes coordination simple and effective."
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to join the AeroAid network?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Sign up today to be part of a community saving lives with drone technology.
          </p>
          <div className="inline-flex space-x-4">
            <Link
              to="/register"
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg transition-colors shadow-lg"
            >
              Register Now
            </Link>
            <Link
              to="/login"
              className="bg-transparent text-white hover:bg-blue-700 font-bold py-3 px-8 rounded-lg border border-white transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Logo color="white" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© {new Date().getFullYear()} AeroAid. All rights reserved.</p>
              <p className="text-sm text-gray-500 mt-1">Emergency drone response platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;