// File: src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserEmergencies } from '../services/emergencyService';
import { getOperatorAssignments } from '../services/searchService';
import { calculateDistance } from '../utils/geoUtils';
import NotificationsList from '../components/notifications/NotificationsList';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { createTestNotification } from '../services/notificationService';
import { forceNotifyAllOperators, createTestEmergencyForNotifications } from '../services/emergencyService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [activeTab, setActiveTab] = useState('emergencies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (currentUser) {
          // Get user's emergency requests
          const userEmergencies = await getUserEmergencies(currentUser.uid);
          setEmergencies(userEmergencies);
          
          // If user is a drone operator, get their assignments and nearby emergencies
          if (userProfile?.isDroneOperator) {
            const operatorAssignments = await getOperatorAssignments(currentUser.uid);
            setAssignments(operatorAssignments);
            
            // Fetch active emergencies near the operator
            await fetchNearbyEmergencies();
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time listener for nearby emergencies
    const intervalId = setInterval(() => {
      if (userProfile?.isDroneOperator) {
        fetchNearbyEmergencies();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [currentUser, userProfile]);

  const fetchNearbyEmergencies = async () => {
    if (!userProfile?.location) return;
    
    try {
      // Get all active emergency requests
      const emergenciesRef = collection(db, 'emergencies');
      const q = query(
        emergenciesRef, 
        where('status', 'in', ['active', 'in-progress']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const allEmergencies = [];
      
      querySnapshot.forEach(doc => {
        // Include ALL emergencies for testing
        allEmergencies.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      // Calculate distance and filter emergencies within 5km
      const nearby = allEmergencies.filter(emergency => {
        if (!emergency.location) return false;
        
        const distance = calculateDistance(
          userProfile.location.latitude,
          userProfile.location.longitude,
          emergency.location.latitude, 
          emergency.location.longitude
        );
        
        // Add distance to the emergency object
        emergency.distance = distance;
        
        // Return true if within 5km
        return distance <= 5;
      });
      
      // Sort by distance
      nearby.sort((a, b) => a.distance - b.distance);
      
      console.log(`Found ${nearby.length} nearby emergencies`, nearby);
      
      setNearbyEmergencies(nearby);
    } catch (error) {
      console.error('Error fetching nearby emergencies:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="space-x-2">
          <Link
            to="/emergency"
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Report Emergency
          </Link>
          
          <Link
            to="/profile"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            My Profile
          </Link>
        </div>
      </div>
      
      {/* Updated grid layout with better column sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {userProfile?.isDroneOperator && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Drone Operator Status</h2>
              <p>
                Your current location is set to: 
                {userProfile.location ? 
                  ` Lat: ${userProfile.location.latitude.toFixed(6)}, Lng: ${userProfile.location.longitude.toFixed(6)}` : 
                  ' Not set'}
              </p>
              <p className="mt-2">
                You will be notified of emergencies within 3km of your location.
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'emergencies'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('emergencies')}
                >
                  My Emergency Requests
                </button>
                
                {userProfile?.isDroneOperator && (
                  <>
                    <button
                      className={`py-2 px-4 border-b-2 font-medium text-sm ${
                        activeTab === 'assignments'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('assignments')}
                    >
                      My Search Assignments
                    </button>
                    
                    <button
                      className={`py-2 px-4 border-b-2 font-medium text-sm ${
                        activeTab === 'nearby'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('nearby')}
                    >
                      Nearby Emergencies
                      {nearbyEmergencies.length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {nearbyEmergencies.length}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'emergencies' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">My Emergency Requests</h2>
                  
                  {emergencies.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                      <p className="mb-4">You haven't submitted any emergency requests yet.</p>
                      <Link
                        to="/emergency"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
                      >
                        Create New Request
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                              Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {emergencies.map((emergency) => (
                            <tr key={emergency.id}>
                              <td className="px-6 py-4">
                                {formatDate(emergency.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                {emergency.type}
                              </td>
                              <td className="px-6 py-4">
                                {emergency.address?.substring(0, 30) || 'N/A'}...
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${emergency.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 
                                    emergency.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-green-100 text-green-800'}`}
                                >
                                  {emergency.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">
                                <Link
                                  to={`/emergency/${emergency.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'assignments' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">My Search Assignments</h2>
                  
                  {assignments.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                      <p>You don't have any active search assignments.</p>
                      {nearbyEmergencies.length > 0 && (
                        <div className="mt-4">
                          <p className="mb-2">There are {nearbyEmergencies.length} emergencies near you that need help.</p>
                          <button
                            onClick={() => setActiveTab('nearby')}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
                          >
                            View Nearby Emergencies
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Emergency ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assignments.map((assignment) => (
                            <tr key={assignment.id}>
                              <td className="px-6 py-4">
                                {formatDate(assignment.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                {assignment.emergencyId.substring(0, 8)}...
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${assignment.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                                    'bg-green-100 text-green-800'}`}
                                >
                                  {assignment.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">
                                <Link
                                  to={`/search/${assignment.id}`}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  View Assignment
                                </Link>
                                <Link
                                  to={`/emergency/${assignment.emergencyId}`}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  View Emergency
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'nearby' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Nearby Emergencies</h2>
                  
                  {nearbyEmergencies.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                      <p>There are no active emergencies nearby.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {nearbyEmergencies.map((emergency) => (
                        <div key={emergency.id} className="bg-white p-4 rounded-lg shadow-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg">{emergency.type}</h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {formatDate(emergency.createdAt)}
                              </p>
                              <p className="mb-2 text-sm">{emergency.details.substring(0, 150)}...</p>
                              <p className="text-sm text-gray-600">
                                Location: {emergency.address?.substring(0, 50) || 'Unknown'}...
                              </p>
                              <p className="text-sm font-semibold text-blue-600">
                                Distance: {emergency.distance.toFixed(2)} km
                              </p>
                            </div>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${emergency.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-blue-100 text-blue-800'}`}
                            >
                              {emergency.status}
                            </span>
                          </div>
                          <div className="mt-4 text-right">
                            <Link
                              to={`/emergency/${emergency.id}`}
                              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
                            >
                              View & Respond
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Notifications panel - moved to 1/4 width column */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden sticky top-4">
            <div className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
              <h2 className="font-bold text-lg">Notifications</h2>
              <button 
                onClick={() => window.location.reload()}
                className="text-sm text-white hover:text-blue-100"
              >
                Refresh
              </button>
            </div>
            {userProfile && currentUser && (
              <NotificationsList userId={currentUser.uid} />
            )}
          </div>
        </div>
      </div>
      
      {/* Debug tools section */}
      <div className="bg-gray-100 p-4 rounded-lg mt-6 border border-gray-300">
        <h3 className="font-bold text-lg mb-2">Debug Tools</h3>
        <p className="text-sm text-gray-600 mb-3">
          Use these tools to test the application functionality. These will be removed in production.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Notifications</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  try {
                    // Create a test notification
                    await createTestNotification(currentUser.uid, 
                      nearbyEmergencies.length > 0 ? nearbyEmergencies[0].id : 'testEmergencyId');
                    toast.success('Test notification created successfully!');
                  } catch (error) {
                    console.error('Error creating test notification:', error);
                    toast.error('Failed to create test notification');
                  }
                }}
                className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Test Notification (Self)
              </button>
              
              <button
                onClick={async () => {
                  try {
                    // Look for emergencies in both the regular list and nearby emergencies
                    const allEmergencies = [...emergencies, ...nearbyEmergencies];
                    
                    if (allEmergencies.length === 0) {
                      return toast.error('No emergencies found. Create one first.');
                    }
                    
                    // Force notify all operators about the first emergency
                    const result = await forceNotifyAllOperators(allEmergencies[0].id, currentUser.uid);
                    if (result.success) {
                      toast.success(`Notified ${result.notifiedOperators} operators about emergency ${allEmergencies[0].id.substring(0, 8)}`);
                      console.log("Notification success, check console for details");
                    } else {
                      toast.error('Failed to send notifications: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error forcing notifications:', error);
                    toast.error('Failed to force notifications');
                  }
                }}
                className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
              >
                Force Notify All Operators
              </button>
              
              <button
                onClick={async () => {
                  try {
                    // Create a test emergency and notify operators
                    if (!userProfile?.location) {
                      return toast.error('Location not set. Update your location first.');
                    }
                    
                    const result = await createTestEmergencyForNotifications(
                      currentUser.uid, 
                      userProfile.location,
                      true
                    );
                    
                    if (result.success) {
                      toast.success(`Created test emergency and notified ${result.notifiedOperators} operators`);
                    } else {
                      toast.error('Failed to create test emergency: ' + result.error);
                    }
                  } catch (error) {
                    console.error('Error creating test emergency:', error);
                    toast.error('Failed to create test emergency');
                  }
                }}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Create Test Emergency + Notify
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Data & Debugging</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  fetchNearbyEmergencies();
                  toast.info('Refreshed nearby emergencies list');
                }}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Refresh Nearby Emergencies
              </button>
              
              <button
                onClick={() => {
                  console.log('Current user:', currentUser);
                  console.log('User profile:', userProfile);
                  console.log('Current user location:', userProfile?.location);
                  console.log('Nearby emergencies:', nearbyEmergencies);
                  console.log('User emergencies:', emergencies);
                  console.log('User assignments:', assignments);
                  toast.info('Debug info logged to console');
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Log All Debug Info
              </button>
              
              <button
                onClick={() => {
                  // Force refresh the page
                  window.location.reload();
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Testing Instructions:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Create a test emergency with "Create Test Emergency + Notify"</li>
            <li>Switch to another browser/incognito window with a different drone operator account</li>
            <li>Check if notifications appear in that account</li>
            <li>If no notifications appear, use "Force Notify All Operators" in the original account</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;