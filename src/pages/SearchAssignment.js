// File: src/pages/SearchAssignment.js
// Complete Search Assignment component with improved location handling

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSearchAssignmentById, subscribeToSearchAssignment, updateDroneLocation, completeSearchAssignment } from '../services/searchService';
import { getEmergencyById, addFindingToEmergency } from '../services/emergencyService';
import { getCurrentLocation } from '../utils/geoUtils';
import { toast } from 'react-toastify';
import MapView from '../components/map/MapView';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import WeatherWidget from '../components/weather/WeatherWidget';
import ChatWindow from '../components/chat/ChatWindow';


const SearchAssignment = () => {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState(null);
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [findingForm, setFindingForm] = useState({
    description: '',
    location: null
  });
  const [submittingFinding, setSubmittingFinding] = useState(false);
  const [completingAssignment, setCompletingAssignment] = useState(false);
  
  // Location handling states
  const [locationError, setLocationError] = useState(null);
  const [manualLocationUpdating, setManualLocationUpdating] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState({
    latitude: '',
    longitude: ''
  });
  
  // Reference for location tracking interval
  const locationTrackingRef = useRef(null);
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Add this state at the top of your component
  const [selectedImage, setSelectedImage] = useState(null);

  // Function to close the modal
  const closeModal = () => setSelectedImage(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get assignment details
        const assignmentData = await getSearchAssignmentById(id);
        setAssignment(assignmentData);
        
        if (assignmentData) {
          // Get related emergency details
          const emergencyData = await getEmergencyById(assignmentData.emergencyId);
          setEmergency(emergencyData);
          
          // Set initial coordinates for manual input based on current drone location
          if (assignmentData.droneLocation) {
            setManualCoordinates({
              latitude: assignmentData.droneLocation.latitude.toString(),
              longitude: assignmentData.droneLocation.longitude.toString()
            });
          }
        }
      } catch (error) {
        console.error('Error fetching assignment data:', error);
        toast.error('Error loading assignment details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Subscribe to real-time updates for the assignment
    const unsubscribe = subscribeToSearchAssignment(id, (data) => {
      console.log('Real-time update received:', data); // Debug log
      if (data) {
        setAssignment(data);
        
        // Update emergency details if findings change
        if (data.emergencyId) {
          getEmergencyById(data.emergencyId).then((updatedEmergency) => {
            console.log('Updated emergency data:', updatedEmergency); // Debug log
            setEmergency(updatedEmergency);
          }).catch((error) => {
            console.error('Error fetching emergency data:', error);
          });
        }
      }
    });
    
    // Start location tracking if assignment is active
    startLocationTracking();
    
    return () => {
      unsubscribe();
      stopLocationTracking();
    };
  }, [id]);
  
  // Enhanced location update function
// Update the updateLocation function with better null checks:

const updateLocation = async (manualLocation = null) => {
  try {
    setLocationError(null);
    let location;
    
    if (manualLocation) {
      location = manualLocation;
    } else {
      try {
        console.log('Attempting to get current location...');
        location = await getCurrentLocation();
        console.log('Successfully got location:', location);
      } catch (geoError) {
        console.error('Browser geolocation failed:', geoError);
        
        // First try to use existing drone location as fallback
        if (assignment && assignment.droneLocation) {
          console.log('Using current drone location as fallback');
          location = {
            latitude: assignment.droneLocation.latitude,
            longitude: assignment.droneLocation.longitude
          };
        } 
        // Then try to use user's profile location as fallback
        else if (userProfile && userProfile.location) {
          console.log('Using user profile location as fallback');
          location = {
            latitude: userProfile.location.latitude,
            longitude: userProfile.location.longitude
          };
          
          if (!locationTrackingRef.current) {
            toast.info('Using profile location as fallback');
          }
        } else {
          // No fallbacks available
          setLocationError('Location access denied and no fallback location available.');
          return false;
        }
      }
    }
    
    // Rest of your function remains the same...
    // Skip update if location hasn't changed significantly
    if (assignment && assignment.droneLocation && !manualLocation) {
      const currentLat = assignment.droneLocation.latitude;
      const currentLng = assignment.droneLocation.longitude;
      const newLat = location.latitude;
      const newLng = location.longitude;
      
      // If location is almost the same, don't update
      const threshold = 0.0001;
      if (
        Math.abs(currentLat - newLat) < threshold && 
        Math.abs(currentLng - newLng) < threshold
      ) {
        console.log('Location hasn\'t changed significantly, skipping update');
        return true;
      }
    }
    
    // Update drone location in database
    console.log('Updating drone location to:', location);
    await updateDroneLocation(id, location);
    
    // Only show toast for manual updates
    if (!locationTrackingRef.current) {
      toast.success('Drone location updated');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating location:', error);
    setLocationError(error.message);
    return false;
  }
};
  
  // Manual coordinates handler
  const handleManualCoordinateChange = (e) => {
    const { name, value } = e.target;
    setManualCoordinates(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit manual coordinates
  const handleManualLocationSubmit = async (e) => {
    e.preventDefault();
    setManualLocationUpdating(true);
    
    try {
      // Validate coordinates
      const lat = parseFloat(manualCoordinates.latitude);
      const lng = parseFloat(manualCoordinates.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Invalid coordinates. Latitude must be between -90 and 90, and longitude between -180 and 180.');
      }
      
      const location = {
        latitude: lat,
        longitude: lng
      };
      
      const success = await updateLocation(location);
      if (success) {
        toast.success('Location updated successfully');
        setShowManualLocation(false);
      }
    } catch (error) {
      console.error('Error with manual coordinates:', error);
      toast.error(error.message);
    } finally {
      setManualLocationUpdating(false);
    }
  };
  
  // Improved location tracking
  const startLocationTracking = () => {
    if (locationTrackingRef.current) return;
    
    console.log('Starting location tracking');
    
    // Use a flag to indicate this is an automatic update
    locationTrackingRef.current = setInterval(async () => {
      try {
        await updateLocation();
      } catch (error) {
        // Error is already handled in updateLocation
        console.log('Location tracking cycle skipped due to error');
      }
    }, 40000); // Update every 40 seconds instead of 10 seconds
  };
  
  // Stop location tracking
  const stopLocationTracking = () => {
    if (locationTrackingRef.current) {
      clearInterval(locationTrackingRef.current);
      locationTrackingRef.current = null;
    }
  };
  
  const handleFindingInputChange = (e) => {
    const { name, value } = e.target;
    setFindingForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleGetFindingLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setFindingForm(prev => ({
        ...prev,
        location
      }));
      toast.success('Location captured for finding');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('Failed to get location: ' + error.message);
      
      // Offer to use drone's current location instead
      if (assignment?.droneLocation) {
        if (window.confirm('Unable to get current location. Use drone\'s current position instead?')) {
          setFindingForm(prev => ({
            ...prev,
            location: {
              latitude: assignment.droneLocation.latitude,
              longitude: assignment.droneLocation.longitude
            }
          }));
        }
      }
    }
  };
  
// In handleSubmitFinding function, modify the try/catch block:

const handleSubmitFinding = async (e) => {
  e.preventDefault();

  try {
    setSubmittingFinding(true);

    // Get location
    let findingLocation = findingForm.location;
    if (!findingLocation && assignment?.droneLocation) {
      findingLocation = {
        latitude: assignment.droneLocation.latitude,
        longitude: assignment.droneLocation.longitude,
      };
    }

    // Basic finding data
    const findingData = {
      description: findingForm.description,
      operatorId: currentUser.uid,
      location: findingLocation,
      timestamp: new Date().toISOString(),
    };

    // Add the image as Base64 if available
    if (imagePreview) {
      findingData.imageBase64 = imagePreview;
    }

    // Add finding to emergency
    await addFindingToEmergency(emergency.id, findingData);

    // Fetch updated emergency data
    const updatedEmergency = await getEmergencyById(emergency.id);
    setEmergency(updatedEmergency); // Update the state with the latest data

    // Reset form
    setFindingForm({ description: '', location: null });
    setImageFile(null);
    setImagePreview(null);

    toast.success('Finding reported successfully!');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error: ' + error.message);
  } finally {
    setSubmittingFinding(false);
  }
};

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    // Handle string ISO timestamps (new format)
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    
    // Handle Firestore Timestamps (old format)
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    
    // Fallback
    return 'Unknown time';
  };

  const handleCompleteAssignment = async () => {
    if (window.confirm('Are you sure you want to complete this assignment?')) {
      try {
        setCompletingAssignment(true);
        
        // Stop location tracking before completing
        if (locationTrackingRef.current) {
          clearInterval(locationTrackingRef.current);
          locationTrackingRef.current = null;
        }
        
        // Complete the assignment
        await completeSearchAssignment(id);
        
        toast.success('Assignment completed successfully!');
        
        // Use a setTimeout to give the toast time to show before navigation
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (error) {
        console.error('Error completing assignment:', error);
        toast.error('Failed to complete assignment: ' + (error.message || 'Unknown error'));
        setCompletingAssignment(false);
      }
    }
  };
  
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview and convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // This is the Base64 representation
      };
      reader.readAsDataURL(file);
    }
  };
  


  const uploadImage = async () => {
    console.log('uploadImage called');
    if (!imageFile) {
      console.log('No image file, returning null');
      return null;
    }
    
    try {
      console.log('Starting upload for:', imageFile.name);
      setUploadingImage(true);
      
      // Create a unique file path
      const fileName = `${Date.now()}_${imageFile.name}`;
      const filePath = `findings/${emergency.id}/${fileName}`;
      console.log('File will be uploaded to:', filePath);
      
      const storageRef = ref(storage, filePath);
      
      // Upload file
      console.log('Starting uploadBytes...');
      const snapshot = await uploadBytes(storageRef, imageFile);
      console.log('uploadBytes completed:', snapshot);
      
      // Get URL
      console.log('Getting download URL...');
      const url = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', url);
      
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw to be handled by caller
    } finally {
      console.log('Setting uploadingImage to false');
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading assignment details...</p>
      </div>
    );
  }
  
  if (!assignment) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-4">Assignment Not Found</h2>
        <p>The assignment you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard" className="text-blue-500 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  // Check if the assignment belongs to the current user
  if (assignment.operatorId !== currentUser.uid) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-4">Unauthorized</h2>
        <p>You don't have permission to view this assignment.</p>
        <Link to="/dashboard" className="text-blue-500 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-500 hover:underline">&larr; Back to Dashboard</Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Search Assignment</h2>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
              ${assignment.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
            >
              {assignment.status}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Emergency Details</h3>
                {emergency ? (
                  <>
                    <p><strong>Type:</strong> {emergency.type}</p>
                    <p><strong>Status:</strong> {emergency.status}</p>
                    <p><strong>Description:</strong> {emergency.details}</p>
                    <Link 
                      to={`/emergency/${emergency.id}`}
                      className="text-blue-500 hover:underline mt-2 inline-block"
                    >
                      View Full Emergency Details
                    </Link>
                  </>
                ) : (
                  <p>Loading emergency details...</p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Assignment Details</h3>
                <p><strong>Status:</strong> {assignment.status}</p>
                <p><strong>Created:</strong> {new Date(assignment.createdAt).toLocaleString()}</p>
                {assignment.status === 'completed' && (
                  <p><strong>Completed:</strong> {new Date(assignment.completedAt).toLocaleString()}</p>
                )}
              </div>
              
              {/* Location Update Controls */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Drone Location</h3>
                <p>
                  <strong>Current Position:</strong> Lat: {assignment.droneLocation.latitude.toFixed(6)}, 
                  Lng: {assignment.droneLocation.longitude.toFixed(6)}
                </p>
                
                <button
                  type="button"
                  onClick={() => updateLocation()}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
                  disabled={manualLocationUpdating}
                >
                  Update Drone Location
                </button>
              </div>
              
              {locationError && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Location Error</h3>
                      <div className="mt-1 text-sm text-yellow-700">
                        <p>{locationError}</p>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <button
                          type="button"
                          onClick={() => updateLocation()}
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-2 py-1 rounded text-xs font-medium"
                        >
                          Try Again
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowManualLocation(true)}
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-2 py-1 rounded text-xs font-medium"
                        >
                          Enter Manually
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {showManualLocation && (
                <div className="bg-white border border-gray-200 rounded-md p-4 mb-4">
                  <h3 className="text-sm font-medium mb-2">Enter Location Coordinates</h3>
                  <form onSubmit={handleManualLocationSubmit} className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500">Latitude</label>
                      <input
                        type="text"
                        name="latitude"
                        value={manualCoordinates.latitude}
                        onChange={handleManualCoordinateChange}
                        placeholder="e.g. 31.9507"
                        className="border rounded px-2 py-1 w-full text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Longitude</label>
                      <input
                        type="text"
                        name="longitude"
                        value={manualCoordinates.longitude}
                        onChange={handleManualCoordinateChange}
                        placeholder="e.g. 34.8093"
                        className="border rounded px-2 py-1 w-full text-sm"
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        disabled={manualLocationUpdating}
                      >
                        {manualLocationUpdating ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualLocation(false)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Tip: You can get coordinates from Google Maps by right-clicking on a location and selecting "What's here?"
                    </p>
                  </form>
                </div>
              )}
              
              {assignment.status === 'active' && emergency?.status !== 'resolved' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Report a Finding</h3>
                  <form onSubmit={handleSubmitFinding}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows="3"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Describe what you found..."
                        value={findingForm.description}
                        onChange={handleFindingInputChange}
                        required
                      ></textarea>
                    </div>
                    
                    {/* Add photo upload section */}
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Photo Evidence (Optional)
                      </label>
                      <div className="flex items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="photo-upload"
                        />
                        <label
                          htmlFor="photo-upload"
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
                        >
                          Select Photo
                        </label>
                        {imageFile && (
                          <span className="ml-2 text-sm">
                            {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                          </span>
                        )}
                      </div>
                      
                      {imagePreview && (
                        <div className="mt-2">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="h-40 object-contain border rounded" 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="mt-1 text-xs text-red-600 hover:text-red-800"
                          >
                            Remove Photo
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <p className="block text-gray-700 text-sm font-bold mb-2">
                        Finding Location
                      </p>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={handleGetFindingLocation}
                          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                        >
                          Capture Current Location
                        </button>
                        <span className="text-sm">
                          {findingForm.location ? 
                            `Lat: ${findingForm.location.latitude.toFixed(6)}, Lng: ${findingForm.location.longitude.toFixed(6)}` : 
                            'No location captured'}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      disabled={submittingFinding || uploadingImage}
                    >
                      {submittingFinding ? 'Submitting...' : 'Report Finding'}
                    </button>
                  </form>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Search Area Map</h3>
              <div className="h-96 bg-gray-200 rounded">
                <MapView 
                  center={{
                    lat: assignment.searchArea.center.latitude,
                    lng: assignment.searchArea.center.longitude
                  }}
                  zoom={16}
                  markers={[
                    {
                      position: {
                        lat: emergency?.location.latitude,
                        lng: emergency?.location.longitude
                      },
                      title: 'Emergency Location',
                      icon: 'red'
                    },
                    {
                      position: {
                        lat: assignment.droneLocation.latitude,
                        lng: assignment.droneLocation.longitude
                      },
                      title: 'Drone Location',
                      icon: 'blue'
                    }
                  ]}
                  searchArea={{
                    north: assignment.searchArea.north,
                    south: assignment.searchArea.south,
                    east: assignment.searchArea.east,
                    west: assignment.searchArea.west
                  }}
                  findings={emergency?.findings?.map(f => ({
                    position: {
                      lat: f.location.latitude,
                      lng: f.location.longitude
                    },
                    title: f.description
                  }))}
                />
              </div>

              {/* Weather Widget */}
              {assignment?.searchArea?.center && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Weather Information</h3>
                  <WeatherWidget 
                    latitude={assignment.searchArea.center.latitude} 
                    longitude={assignment.searchArea.center.longitude} 
                  />
                </div>
              )}

              {/* Update the "Recent Findings" section to make images clickable */}
              {emergency?.findings && emergency.findings.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Recent Findings</h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {emergency.findings.map((finding) => (
                      <li key={finding.id} className="bg-blue-50 p-3 rounded">
                        <p className="font-medium">{finding.description}</p>
                        
                        {/* Display Base64 image if available */}
                        {finding.imageBase64 && (
                          <div className="mt-2 mb-2">
                            <img 
                              src={finding.imageBase64}
                              alt="Finding evidence" 
                              className="max-h-60 w-auto rounded border border-gray-300 cursor-pointer"
                              onClick={() => setSelectedImage(finding.imageBase64)} // Set the selected image on click
                            />
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600">
                          Reported at {formatTimestamp(finding.timestamp)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add the ChatWindow component here */}
              <div className="mt-6">
                <ChatWindow emergencyId={emergency.id} />
              </div>

            </div>
          </div>
          
          {assignment.status === 'active' && (
            <div className="mt-8 flex justify-center border-t border-gray-200 pt-6">
              <button
                onClick={handleCompleteAssignment}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                disabled={completingAssignment}
              >
                {completingAssignment ? 'Completing...' : 'Complete Assignment'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add this modal component at the bottom of your JSX */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative">
            <img 
              src={selectedImage} 
              alt="Enlarged evidence" 
              className="max-w-full max-h-screen rounded"
            />
            <button 
              onClick={closeModal} 
              className="absolute top-2 right-2 bg-white text-black rounded-full p-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAssignment;