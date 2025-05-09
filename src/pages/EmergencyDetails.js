// src/pages/EmergencyDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEmergencyById, subscribeToEmergency, updateEmergencyStatus } from '../services/emergencyService';
import { acceptEmergency, getOperatorAssignments, getSearchAssignmentById } from '../services/searchService';
import { getCurrentLocation, calculateDistance } from '../utils/geoUtils';
import { toast } from 'react-toastify';
import MapView from '../components/map/MapView';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  GeoPoint
} from 'firebase/firestore';
import { db } from '../services/firebase';

const EmergencyDetails = () => {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [userAssignment, setUserAssignment] = useState(null);
  const [userDistance, setUserDistance] = useState(null);
  const [hasActiveAssignments, setHasActiveAssignments] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [searchAssignments, setSearchAssignments] = useState([]);
  
  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const data = await getEmergencyById(id);
        setEmergency(data);
        
        // If user is a drone operator, check their status
        if (userProfile?.isDroneOperator) {
          // Check if the user already has an active emergency directly from their profile
          if (userProfile.emergencyId) {
            // User has an active emergency
            setHasActiveAssignments(true);
            
            // If it's this emergency, get the assignment
            if (userProfile.emergencyId === id && userProfile.currentAssignmentId) {
              const assignment = await getSearchAssignmentById(userProfile.currentAssignmentId);
              setUserAssignment(assignment);
              setActiveAssignmentId(userProfile.currentAssignmentId);
            } else {
              // It's a different emergency
              setActiveAssignmentId(userProfile.currentAssignmentId);
            }
          } else {
            // Fallback to the original method if the emergencyId field is not set
            // This handles cases where the database might not be fully migrated yet
            const assignments = await getOperatorAssignments(currentUser.uid);
            const assignment = assignments.find(a => a.emergencyId === id);
            setUserAssignment(assignment);
            
            // Check if user has any active assignments
            setHasActiveAssignments(assignments.length > 0);
            if (assignments.length > 0) {
              setActiveAssignmentId(assignments[0].id);
            }
          }
          
          // Calculate distance from operator to emergency
          if (userProfile.location && data.location) {
            const distance = calculateDistance(
              userProfile.location.latitude,
              userProfile.location.longitude,
              data.location.latitude,
              data.location.longitude
            );
            setUserDistance(distance);
          }
        }

        // Fetch search assignments for this emergency
        if (data) {
          fetchSearchAssignments(id);
        }
      } catch (error) {
        console.error('Error fetching emergency:', error);
        toast.error('Error loading emergency details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmergency();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToEmergency(id, (data) => {
      if (data) {
        setEmergency(data);
      }
    });
    
    return () => unsubscribe();
  }, [id, currentUser, userProfile]);
  
  // Function to fetch search assignments
  const fetchSearchAssignments = async (emergencyId) => {
    try {
      console.log("Fetching search assignments for emergency:", emergencyId);

      // Use imported functions (no require statements)
      const assignmentsRef = collection(db, 'searchAssignments');

      const q = query(
        assignmentsRef, 
        where('emergencyId', '==', emergencyId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const assignments = [];

      querySnapshot.forEach((doc) => {
        assignments.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log("Found assignments:", assignments.length, assignments);

      setSearchAssignments(assignments);
    } catch (error) {
      console.error('Error fetching search assignments:', error);
    }
  };
  
  const handleAcceptEmergency = async () => {
    try {
      setAccepting(true);
      
      // Get user's current location with better error handling
      let location;
      try {
        location = await getCurrentLocation();
      } catch (locationError) {
        console.error('Error getting location:', locationError);
        
        // Fall back to using user's profile location if available
        if (userProfile?.location) {
          console.log('Falling back to profile location:', userProfile.location);
          location = userProfile.location;
        } else {
          // If no profile location, show error and abort
          toast.error(`Location error: ${locationError.message}. Please update your location in your profile.`);
          setAccepting(false);
          return;
        }
      }
      
      // Now proceed with accepting the emergency using the location we have
      console.log('Accepting emergency with location:', location);
      
      const assignmentId = await acceptEmergency(id, currentUser.uid, location);
      toast.success('Emergency accepted! You have been assigned a search area.');
      navigate(`/search/${assignmentId}`);
    } catch (error) {
      console.error('Error accepting emergency:', error);
      toast.error('Failed to accept emergency: ' + error.message);
    } finally {
      setAccepting(false);
    }
  };
  
  const handleResolveEmergency = async () => {
    if (window.confirm('Are you sure you want to mark this emergency as resolved?')) {
      try {
        await updateEmergencyStatus(id, 'resolved');
        toast.success('Emergency marked as resolved');
      } catch (error) {
        console.error('Error resolving emergency:', error);
        toast.error('Failed to resolve emergency: ' + error.message);
      }
    }
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    
    return 'Unknown time';
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading emergency details...</p>
      </div>
    );
  }
  
  if (!emergency) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-4">Emergency Not Found</h2>
        <p>The emergency you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard" className="text-blue-500 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  const isCreator = currentUser.uid === emergency.userId;
  const canAccept = userProfile?.isDroneOperator && 
                   !userAssignment && 
                   !hasActiveAssignments &&
                   emergency.status !== 'resolved' && 
                   (userDistance === null || userDistance <= 3);

  const canView = !!currentUser;

  if (!canView) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-4">Unauthorized</h2>
        <p>You must be logged in to view this emergency.</p>
        <Link to="/login" className="text-blue-500 hover:underline mt-4 inline-block">
          Go to Login
        </Link>
      </div>
    );
  }

  console.log("Search Assignments:", searchAssignments);
  console.log("Search Assignments Length:", searchAssignments ? searchAssignments.length : 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-500 hover:underline">&larr; Back to Dashboard</Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Emergency #{id.substring(0, 8)}</h2>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
              ${emergency.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 
                emergency.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                emergency.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'}`}
            >
              {emergency.status === 'completed' ? 'Work Completed' : emergency.status}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Emergency Type</h3>
                <p>{emergency.type}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <p className="whitespace-pre-wrap">{emergency.details}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <p>{emergency.address || 'Unknown location'}</p>
                <p className="text-sm text-gray-600">
                  Lat: {emergency.location.latitude.toFixed(6)}, 
                  Lng: {emergency.location.longitude.toFixed(6)}
                </p>
                {userDistance !== null && (
                  <p className="text-sm text-gray-600 mt-1">
                    Distance from you: {userDistance.toFixed(2)} km
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Timeline</h3>
                <p>Created: {formatDate(emergency.createdAt)}</p>
                {emergency.status === 'resolved' && emergency.resolvedAt && (
                  <p>Resolved: {formatDate(emergency.resolvedAt)}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Location Map</h3>
              <div className="h-64 bg-gray-200 rounded">
                <MapView 
                  center={{
                    lat: emergency.location.latitude,
                    lng: emergency.location.longitude
                  }}
                  zoom={15}
                  markers={[{
                    position: {
                      lat: emergency.location.latitude,
                      lng: emergency.location.longitude
                    },
                    title: 'Emergency Location'
                  }]}
                />
              </div>
              
              {emergency.findings && emergency.findings.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Reported Findings</h3>
                  <ul className="space-y-2">
                    {emergency.findings.map((finding) => (
                      <li key={finding.id} className="bg-blue-50 p-3 rounded">
                        <p className="font-medium">{finding.description}</p>
                        
                        {finding.imageBase64 && (
                          <div className="mt-2 mb-2">
                            <img 
                              src={finding.imageBase64}
                              alt="Finding evidence" 
                              className="max-h-60 w-auto rounded border border-gray-300" 
                            />
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600">
                          Reported by operator at {formatTimestamp(finding.timestamp)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Location: Lat {finding.location?.latitude.toFixed(6)}, 
                          Lng {finding.location?.longitude.toFixed(6)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Active Search Assignments Section */}
          {searchAssignments.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold mb-4">Active Search Assignments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignment ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {assignment.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {assignment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {assignment.createdAt ? new Date(assignment.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/search/${assignment.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Search Assignment
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-gray-200 pt-6">
            {/* Accept Emergency Button (Only for eligible drone operators) */}
            {canAccept && (
              <button
                onClick={handleAcceptEmergency}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                disabled={accepting}
              >
                {accepting ? 'Accepting...' : 'Accept Emergency'}
              </button>
            )}
            
            {/* View Assignment Button - ALWAYS show this if there are any assignments */}
            {searchAssignments && searchAssignments.length > 0 && (
              <Link
                to={`/search/${searchAssignments[0].id}`}
                className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              >
                View Assignment
              </Link>
            )}
            
            {/* Show View My Assignment if user has an assignment for this emergency */}
            {userAssignment && (
              <Link
                to={`/search/${userAssignment.id}`}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              >
                View My Assignment
              </Link>
            )}
            
            {/* Mark as Resolved Button (Only for creator when work is completed or active) */}
            {isCreator && (emergency.status === 'completed' || emergency.status === 'active') && (
              <button
                onClick={handleResolveEmergency}
                className={`${emergency.status === 'completed' ? 'bg-green-500 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'} text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline`}
              >
                Mark as Resolved
              </button>
            )}
            
            {/* Warning message for operators with existing assignments */}
            {userProfile?.isDroneOperator && hasActiveAssignments && !userAssignment && (
              <div className="w-full mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-yellow-800">
                <p className="font-medium">You already have an active assignment</p>
                <p className="text-sm mt-1">You can only accept one emergency at a time. Please complete your current assignment first.</p>
                <Link 
                  to={`/search/${activeAssignmentId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                >
                  Go to my active assignment →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDetails;