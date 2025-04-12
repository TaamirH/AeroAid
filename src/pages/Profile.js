// File: src/pages/Profile.js
// Updated Profile component with manual location input
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getCurrentLocation, getCoordinatesFromAddress } from '../utils/geoUtils';
import { requestNotificationPermission } from '../services/firebase';

const Profile = () => {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    isDroneOperator: false,
    location: null
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        isDroneOperator: userProfile.isDroneOperator || false,
        location: userProfile.location || null
      });
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        location
      }));
      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error(error.message || 'Failed to get location. Try entering location manually.');
      setShowManualLocation(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualAddress.trim()) {
      return toast.error('Please enter a valid address');
    }
    
    try {
      setLocationLoading(true);
      const coordinates = await getCoordinatesFromAddress(manualAddress);
      
      setFormData(prev => ({
        ...prev,
        location: coordinates
      }));
      
      toast.success('Location updated successfully!');
      setShowManualLocation(false);
    } catch (error) {
      console.error('Error getting coordinates:', error);
      toast.error(error.message || 'Failed to find coordinates for this address. Please try a different address.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (formData.isDroneOperator && !formData.location) {
      return toast.error('Drone operators must provide their location!');
    }
    
    try {
      setLoading(true);
      
      // If becoming a drone operator, request notification permission
      if (formData.isDroneOperator && !userProfile.isDroneOperator) {
        const token = await requestNotificationPermission();
        if (token) {
          await updateUserProfile(currentUser.uid, {
            ...formData,
            notificationToken: token
          });
        } else {
          await updateUserProfile(currentUser.uid, formData);
          toast.warning('Notifications are disabled. You may miss emergency alerts.');
        }
      } else {
        await updateUserProfile(currentUser.uid, formData);
      }
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out: ' + error.message);
    }
  };

  if (!userProfile) {
    return (
      <div className="text-center py-8">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>
      
      <form onSubmit={handleSave}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            value={currentUser.email}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        
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
            
            {!showManualLocation && (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                    disabled={locationLoading}
                  >
                    {locationLoading ? 'Getting...' : 'Update My Location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualLocation(true)}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Enter Manually
                  </button>
                </div>
                
                <div>
                  {formData.location ? (
                    <div className="bg-gray-100 p-3 rounded">
                      <p className="font-semibold">Current Location:</p>
                      <p>Lat: {formData.location.latitude.toFixed(6)}</p>
                      <p>Lng: {formData.location.longitude.toFixed(6)}</p>
                    </div>
                  ) : (
                    <p className="text-yellow-600">No location detected</p>
                  )}
                </div>
              </div>
            )}
            
            {showManualLocation && (
              <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-2">
                <h3 className="font-medium mb-2">Enter Location Manually</h3>
                <div className="mb-3">
                  <label className="block text-gray-700 text-sm mb-1">
                    Address or Location Description
                  </label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter full address, city, or coordinates"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: "123 Main St, New York, NY" or "32.7157, -117.1611"
                  </p>
                </div>
                
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={handleManualLocationSubmit}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                    disabled={locationLoading}
                  >
                    {locationLoading ? 'Processing...' : 'Set Location'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualLocation(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                </div>
                
                {formData.location && (
                  <div className="mt-3 bg-gray-100 p-3 rounded">
                    <p className="font-semibold">Current Coordinates:</p>
                    <p>Lat: {formData.location.latitude.toFixed(6)}</p>
                    <p>Lng: {formData.location.longitude.toFixed(6)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            type="button"
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Logout
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;