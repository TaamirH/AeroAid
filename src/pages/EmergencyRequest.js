// File: src/pages/EmergencyRequest.js
// Updated Emergency Request component with address autocomplete
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createEmergencyRequest } from '../services/emergencyService';
import { getCurrentLocation, getAddressFromCoordinates } from '../utils/geoUtils';
import { toast } from 'react-toastify';
import AddressAutocomplete from '../components/location/AddressAutocomplete';
import { getOperatorAssignments } from '../services/searchService';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp, 
  GeoPoint 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const emergencyTypes = [
  'Missing Person',
  'Lost Pet',
  'Natural Disaster',
  'Structural Damage',
  'Fire',
  'Medical Emergency',
  'Other'
];
const emergencyStatuses = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed', // New status for completed assignments
  RESOLVED: 'resolved'
};

const EmergencyRequest = () => {
  const { currentUser,userProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: emergencyTypes[0],
    details: '',
    location: null,
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);

  // Try to get location on component mount
  useEffect(() => {
    handleGetLocation();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      const address = await getAddressFromCoordinates(location.latitude, location.longitude);
      
      setFormData(prev => ({
        ...prev,
        location,
        address
      }));
      
      setShowManualLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error(error.message || 'Failed to get your location. Please enter your location manually.');
      setShowManualLocation(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: locationData.location,
      address: locationData.address
    }));
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.location) {
      return toast.error('Location is required for emergency requests!');
    }
    
    try {
      setLoading(true);
      
      // Create emergency request
      const emergencyId = await createEmergencyRequest(currentUser.uid, formData);
      
      // AUTOMATICALLY CREATE SEARCH ASSIGNMENT
      try {
        console.log('Creating search assignment for emergency:', emergencyId);
        
        // Check for existing assignments first
        const assignmentsRef = collection(db, 'searchAssignments');
        const q = query(
          assignmentsRef,
          where('emergencyId', '==', emergencyId)
        );
        
        const existingAssignments = await getDocs(q);
        
        // Only create a new assignment if none exist
        if (existingAssignments.empty) {
          // Create search area
          const searchArea = {
            north: formData.location.latitude + 0.003,
            south: formData.location.latitude - 0.003,
            east: formData.location.longitude + 0.003,
            west: formData.location.longitude - 0.003,
            center: {
              latitude: formData.location.latitude,
              longitude: formData.location.longitude
            }
          };
          
          // Create assignment data
          const assignmentData = {
            emergencyId,
            operatorId: null, // No operator assigned yet
            status: 'active',
            startLocation: null, // Will be set when an operator accepts
            searchArea, 
            droneLocation: new GeoPoint(formData.location.latitude, formData.location.longitude),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            completedAt: null
          };
          
          // Add to Firestore - use the imported functions
          const docRef = await addDoc(collection(db, 'searchAssignments'), assignmentData);
          console.log('Search assignment created with ID:', docRef.id);
        } else {
          console.log('Search assignments already exist for this emergency. Skipping creation.');
        }
      } catch (assignmentError) {
        console.error('Error creating search assignment:', assignmentError);
        // Don't stop the user journey if assignment creation fails
      }
      
      toast.success('Emergency request submitted successfully!');
      
      // Check if an assignment was created for the current user
      if (userProfile?.isDroneOperator) {
        const assignments = await getOperatorAssignments(currentUser.uid);
        const assignment = assignments.find(a => a.emergencyId === emergencyId);
        
        if (assignment) {
          // Redirect to the search assignment page instead
          navigate(`/search/${assignment.id}`);
          return;
        }
      }
      
      // Otherwise redirect to emergency details
      navigate(`/emergency/${emergencyId}`);
    } catch (error) {
      console.error('Error creating emergency request:', error);
      toast.error('Failed to create emergency request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Report Emergency</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
            Emergency Type
          </label>
          <select
            id="type"
            name="type"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={formData.type}
            onChange={handleChange}
            required
          >
            {emergencyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
            Details
          </label>
          <textarea
            id="details"
            name="details"
            rows="4"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Describe the emergency situation in detail..."
            value={formData.details}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div className="mb-6">
          <p className="block text-gray-700 text-sm font-bold mb-2">
            Location
          </p>
          
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={handleGetLocation}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              disabled={locationLoading}
            >
              {locationLoading ? 'Getting...' : 'Get My Location'}
            </button>
            <button
              type="button"
              onClick={() => setShowManualLocation(!showManualLocation)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {showManualLocation ? 'Hide Manual Input' : 'Enter Manually'}
            </button>
          </div>
          
          {!showManualLocation && formData.location && (
            <div className="bg-gray-100 p-3 rounded mb-4">
              <p className="font-semibold">Emergency Location:</p>
              <p>Lat: {formData.location.latitude.toFixed(6)}</p>
              <p>Lng: {formData.location.longitude.toFixed(6)}</p>
              {formData.address && (
                <p className="mt-1 text-sm text-gray-600">Address: {formData.address}</p>
              )}
            </div>
          )}
          
          {showManualLocation && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
              <h3 className="font-medium mb-2">Enter Emergency Location</h3>
              <AddressAutocomplete 
                onLocationSelect={handleLocationSelect}
                initialValue={formData.address}
              />
            </div>
          )}
          
          <p className="text-xs text-red-500">
            * Your precise location is necessary to alert nearby drone operators
          </p>
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading || !formData.location}
          >
            {loading ? 'Submitting...' : 'Submit Emergency Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmergencyRequest;