//src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getCurrentLocation } from '../utils/geoUtils';

const Register = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isDroneOperator: false,
    location: null
  });
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('idle');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGetLocation = async () => {
    try {
      setLocationStatus('loading');
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        location
      }));
      setLocationStatus('success');
      toast.success('Location retrieved successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationStatus('error');
      toast.error('Failed to get location: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match!');
    }
    
    if (formData.isDroneOperator && !formData.location) {
      return toast.error('Drone operators must provide their location!');
    }
    
    try {
      setLoading(true);
      await signup(
        formData.email, 
        formData.password, 
        formData.displayName, 
        formData.isDroneOperator,
        formData.location
      );
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Register for AeroAid</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
            Full Name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.displayName}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDroneOperator"
              checked={formData.isDroneOperator}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-gray-700">I am a drone operator</span>
          </label>
        </div>
        
        {formData.isDroneOperator && (
          <div className="mb-6">
            <p className="block text-gray-700 text-sm font-bold mb-2">
              Location
            </p>
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleGetLocation}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                disabled={locationStatus === 'loading'}
              >
                {locationStatus === 'loading' ? 'Getting...' : 'Get My Location'}
              </button>
              <span className="text-sm">
                {formData.location ? 
                  `Lat: ${formData.location.latitude.toFixed(6)}, Lng: ${formData.location.longitude.toFixed(6)}` : 
                  'No location detected'}
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Already have an account?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;