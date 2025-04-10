import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSearchAssignmentById, subscribeToSearchAssignment, updateDroneLocation, completeSearchAssignment } from '../services/searchService';
import { getEmergencyById, addFindingToEmergency } from '../services/emergencyService';
import { getCurrentLocation } from '../utils/geoUtils';
import { toast } from 'react-toastify';
import MapView from '../components/map/MapView';

const SearchAssignment = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
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
  
  // Reference for location tracking interval
  const locationTrackingRef = useRef(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get assignment details
        const assignmentData = await getSearchAssignmentById(id);
        setAssignment(assignmentData);
        
        if (assignmentData) {
          // Get related emergency details
          const emergencyData = await getEmergencyById(assignmentData.emergencyId);
          setEmergency(emergencyData);
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
      if (data) {
        setAssignment(data);
      }
    });
    
    // Start location tracking if assignment is active
    startLocationTracking();
    
    return () => {
      unsubscribe();
      stopLocationTracking();
    };
  }, [id]);
  
  // Start tracking the drone operator's location
  const startLocationTracking = () => {
    if (locationTrackingRef.current) return;
    
    locationTrackingRef.current = setInterval(async () => {
      try {
        const location = await getCurrentLocation();
        await updateDroneLocation(id, location);
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }, 10000); // Update every 10 seconds
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
    }
  };
  
  const handleSubmitFinding = async (e) => {
    e.preventDefault();
    
    if (!findingForm.location) {
      return toast.error('Location is required for findings!');
    }
    
    try {
      setSubmittingFinding(true);
      await addFindingToEmergency(emergency.id, {
        description: findingForm.description,
        location: findingForm.location,
        operatorId: currentUser.uid
      });
      
      toast.success('Finding reported successfully!');
      setFindingForm({
        description: '',
        location: null
      });
    } catch (error) {
      console.error('Error submitting finding:', error);
      toast.error('Failed to submit finding: ' + error.message);
    } finally {
      setSubmittingFinding(false);
    }
  };
  
  const handleCompleteAssignment = async () => {
    if (window.confirm('Are you sure you want to complete this assignment?')) {
      try {
        setCompletingAssignment(true);
        await completeSearchAssignment(id);
        toast.success('Assignment completed successfully!');
        stopLocationTracking();
        navigate('/dashboard');
      } catch (error) {
        console.error('Error completing assignment:', error);
        toast.error('Failed to complete assignment: ' + error.message);
      } finally {
        setCompletingAssignment(false);
      }
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
                      disabled={submittingFinding || !findingForm.location}
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
              
              {emergency?.findings && emergency.findings.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Recent Findings</h3>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {emergency.findings.map((finding) => (
                      <li key={finding.id} className="bg-blue-50 p-3 rounded">
                        <p className="font-medium">{finding.description}</p>
                        <p className="text-sm text-gray-600">
                          Reported at {finding.timestamp?.toDate().toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
    </div>
  );
};

export default SearchAssignment;