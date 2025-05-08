// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserEmergencies } from '../services/emergencyService';
import { getOperatorAssignments, getSearchAssignmentById } from '../services/searchService';
import { calculateDistance } from '../utils/geoUtils';
import NotificationsList from '../components/notifications/NotificationsList';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { createTestNotification } from '../services/notificationService';
import { forceNotifyAllOperators, createTestEmergencyForNotifications } from '../services/emergencyService';
import { toast } from 'react-toastify';
import EmergencyStats from '../components/dashboards/EmergencyStats';
import { getDocs } from 'firebase/firestore';

// Import new UI components
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/loadingSpinner';
import { StatCard } from '../components/ui/statCard';
import { StatusBadge } from '../components/ui/statusBadge';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [activeTab, setActiveTab] = useState('emergencies');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial data loading function
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (currentUser) {
          // Get user's emergency requests
          const userEmergencies = await getUserEmergencies(currentUser.uid);
          setEmergencies(userEmergencies);
          
          // If user is a drone operator, check for active assignments
          if (userProfile?.isDroneOperator) {
            // Check if the user already has an active emergency from their profile
            if (userProfile.emergencyId && userProfile.currentAssignmentId) {
              // Get the specific assignment
              const assignment = await getSearchAssignmentById(userProfile.currentAssignmentId);
              if (assignment && assignment.status === 'active') {
                setAssignments([assignment]);
              } else {
                // Fallback if the assignment isn't found or is not active
                const operatorAssignments = await getOperatorAssignments(currentUser.uid);
                setAssignments(operatorAssignments);
              }
            } else {
              // Fallback to the original method
              const operatorAssignments = await getOperatorAssignments(currentUser.uid);
              setAssignments(operatorAssignments);
            }
            
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
    
    // Call the initial data loading function
    fetchData();
    
    // Set up real-time listeners for emergencies
    let emergencyUnsubscribe = null;
    if (currentUser) {
      const emergenciesRef = collection(db, 'emergencies');
      
      // Query for user's emergencies (real-time updates)
      emergencyUnsubscribe = onSnapshot(
        query(
          emergenciesRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        ),
        (snapshot) => {
          const updatedEmergencies = [];
          
          snapshot.forEach(doc => {
            updatedEmergencies.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
              resolvedAt: doc.data().resolvedAt?.toDate()
            });
          });
          
          setEmergencies(updatedEmergencies);
        },
        (error) => {
          console.error('Error listening to emergencies:', error);
        }
      );
    }
    
    // Set up real-time listener for nearby emergencies
    let nearbyUnsubscribe = null;
    if (userProfile?.isDroneOperator && userProfile?.location) {
      // Instead of using fetchNearbyEmergencies periodically,
      // set up a real-time listener for active emergencies
      const emergenciesRef = collection(db, 'emergencies');
      
      nearbyUnsubscribe = onSnapshot(
        query(
          emergenciesRef,
          where('status', 'in', ['active', 'in-progress']),
          orderBy('createdAt', 'desc')
        ),
        (snapshot) => {
          const allEmergencies = [];
          
          snapshot.forEach(doc => {
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
          
          setNearbyEmergencies(nearby);
        },
        (error) => {
          console.error('Error listening to nearby emergencies:', error);
        }
      );
    }
    
    // Set up real-time listener for assignments
    let assignmentsUnsubscribe = null;
    if (currentUser && userProfile?.isDroneOperator) {
      const assignmentsRef = collection(db, 'searchAssignments');
      
      assignmentsUnsubscribe = onSnapshot(
        query(
          assignmentsRef,
          where('operatorId', '==', currentUser.uid),
          where('status', '==', 'active')
        ),
        (snapshot) => {
          const updatedAssignments = [];
          
          snapshot.forEach(doc => {
            updatedAssignments.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate(),
              updatedAt: doc.data().updatedAt?.toDate(),
              completedAt: doc.data().completedAt?.toDate()
            });
          });
          
          setAssignments(updatedAssignments);
        },
        (error) => {
          console.error('Error listening to assignments:', error);
        }
      );
    }
    
    // Set up a periodic refresh for nearby emergencies as a fallback
    const intervalId = setInterval(() => {
      if (userProfile?.isDroneOperator) {
        fetchNearbyEmergencies();
      }
    }, 60000); // Refresh every minute
    
    // Clean up all listeners on unmount
    return () => {
      if (emergencyUnsubscribe) emergencyUnsubscribe();
      if (nearbyUnsubscribe) nearbyUnsubscribe();
      if (assignmentsUnsubscribe) assignmentsUnsubscribe();
      clearInterval(intervalId);
    };
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          {currentUser && (
            <p className="text-gray-600 mt-1">
              Welcome back, {userProfile?.displayName || currentUser.displayName || 'there'}!
            </p>
          )}
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            type="danger"
            onClick={() => {
              window.location.href = "/emergency";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Report Emergency
          </Button>
          
          <Button
            type="secondary"
            onClick={() => {
              window.location.href = "/profile";
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            My Profile
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {!loading && currentUser && (
            <EmergencyStats userId={currentUser.uid} />
          )}
          
          {userProfile?.isDroneOperator && (
            <Card 
              className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary rounded-md p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900">Drone Operator Status</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Your current location is set to: 
                    {userProfile.location ? 
                      ` Lat: ${userProfile.location.latitude.toFixed(6)}, Lng: ${userProfile.location.longitude.toFixed(6)}` : 
                      ' Not set'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    You will be notified of emergencies within 3km of your location.
                  </p>
                  {!userProfile.location && (
                    <div className="mt-3">
                      <Link 
                        to="/profile"
                        className="text-sm text-primary hover:text-primary-dark font-medium"
                      >
                        Update your location →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
          
          <Card>
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'emergencies'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('emergencies')}
                >
                  My Emergency Requests
                </button>
                
                {userProfile?.isDroneOperator && (
                  <>
                    <button
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === 'assignments'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('assignments')}
                    >
                      My Search Assignments
                    </button>
                    
                    <button
                      className={`py-4 px-6 border-b-2 font-medium text-sm ${
                        activeTab === 'nearby'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('nearby')}
                    >
                      Nearby Emergencies
                      {nearbyEmergencies.length > 0 && (
                        <span className="ml-2 bg-emergency-light text-emergency text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {nearbyEmergencies.length}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </nav>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <LoadingSpinner size="large" color="blue" />
                  <p className="mt-2 text-sm text-gray-500">Loading data...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'emergencies' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">My Emergency Requests</h2>
                        <Button 
                          type="text"
                          onClick={() => window.location.href = "/emergency"}
                        >
                          + New Request
                        </Button>
                      </div>
                      
                      {emergencies.length === 0 ? (
                        <EmptyState 
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6.938 4h13.856c1.54 0 2.502 1.667 1.732 3L13.732 20c-.77 1.333-2.694 1.333-3.464 0L3.34 7c-.77-1.333.192-3 1.732-3z" />
                            </svg>
                          }
                          title="No emergency requests"
                          message="You haven't submitted any emergency requests yet."
                          buttonText="Create New Request"
                          onClick={() => window.location.href = "/emergency"}
                        />
                      ) : (
                        <div className="overflow-x-auto -mx-6">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Location
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
                              {emergencies.map((emergency) => (
                                <tr key={emergency.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(emergency.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {emergency.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {emergency.address?.substring(0, 30) || 'N/A'}...
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={emergency.status} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button 
                                      type="text"
                                      onClick={() => window.location.href = `/emergency/${emergency.id}`}
                                    >
                                      View Details
                                    </Button>
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
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">My Search Assignments</h2>
                      </div>
                      
                      {assignments.length === 0 ? (
                        <EmptyState 
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          }
                          title="No active assignments"
                          message="You don't have any active search assignments."
                          buttonText={nearbyEmergencies.length > 0 ? "View Nearby Emergencies" : null}
                          onClick={() => setActiveTab('nearby')}
                        />
                      ) : (
                        <div className="overflow-x-auto -mx-6">
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
                                <tr key={assignment.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(assignment.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {assignment.emergencyId.substring(0, 8)}...
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={assignment.status} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Button
                                      type="text"
                                      onClick={() => window.location.href = `/search/${assignment.id}`}
                                      className="mr-4"
                                    >
                                      View Assignment
                                    </Button>
                                    <Button
                                      type="text"
                                      onClick={() => window.location.href = `/emergency/${assignment.emergencyId}`}
                                    >
                                      View Emergency
                                    </Button>
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
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Nearby Emergencies</h2>
                        <Button 
                          type="text"
                          onClick={fetchNearbyEmergencies}
                        >
                          Refresh
                        </Button>
                      </div>
                      
                      {/* Check if the user has an active assignment */}
                      {userProfile?.emergencyId && (
                        <Alert
                          type="info"
                          title="You have an active assignment"
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          }
                          className="mb-4"
                        >
                          <p className="text-sm text-blue-700 mt-1">
                            You can only accept one emergency at a time. 
                            Complete your current assignment before accepting another emergency.
                          </p>
                          <Link
                            to={`/search/${userProfile.currentAssignmentId}`}
                            className="text-sm font-medium text-primary hover:text-primary-dark mt-2 inline-block"
                          >
                            Go to my active assignment →
                          </Link>
                        </Alert>
                      )}
                      
                      {/* Display nearby emergencies */}
                      {nearbyEmergencies.length === 0 ? (
                        <EmptyState 
                          icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          }
                          title="No nearby emergencies"
                          message="There are no active emergencies in your area right now."
                        />
                      ) : (
                        <div className="space-y-4">
                          {nearbyEmergencies.map((emergency) => (
                            <div key={emergency.id} className="bg-white p-5 rounded-lg shadow-card hover:shadow-card-hover transition-shadow border border-gray-200">
                              <div className="flex justify-between">
                                <div>
                                  <div className="flex items-center mb-2">
                                    <span className={`w-3 h-3 rounded-full mr-2
                                      ${emergency.status === 'active' ? 'bg-warning' : 
                                        emergency.status === 'in-progress' ? 'bg-primary' : 
                                        'bg-success'}`}
                                    ></span>
                                    <h3 className="font-bold text-lg text-gray-900">{emergency.type}</h3>
                                  </div>
                                  <p className="text-sm text-gray-500 mb-2">
                                    {formatDate(emergency.createdAt)}
                                  </p>
                                  <p className="mb-3 text-gray-700">{emergency.details.substring(0, 150)}...</p>
                                  <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Location:</span> {emergency.address?.substring(0, 50) || 'Unknown'}...
                                  </p>
                                  <p className="text-sm font-medium text-primary">
                                    <span className="inline-flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Distance: {emergency.distance.toFixed(2)} km away
                                    </span>
                                  </p>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                  {userProfile?.emergencyId ? (
                                    <div className="text-right text-sm text-gray-600">
                                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                                        Already have an active assignment
                                      </span>
                                                                              <Link
                                        to={`/emergency/${emergency.id}`}
                                        className="inline-block mt-2 text-primary hover:text-primary-dark"
                                      >
                                        View details →
                                      </Link>
                                    </div>
                                  ) : (
                                    <Button
                                      type="primary"
                                      onClick={() => window.location.href = `/emergency/${emergency.id}`}
                                    >
                                      View & Respond
                                    </Button>
                                  )}
                                </div>
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
          </Card>
          
          {/* Debug Tools Section (redesigned with new components) */}
          <Card 
            title="Debug Tools"
            titleColor="bg-gray-50"
            footer={
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-1">Testing Instructions:</p>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-yellow-700">
                  <li>Create a test emergency with "Create Test Emergency + Notify"</li>
                  <li>Switch to another browser/incognito window with a different drone operator account</li>
                  <li>Check if notifications appear in that account</li>
                  <li>If no notifications appear, use "Force Notify All Operators" in the original account</li>
                </ol>
              </div>
            }
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">Development Only</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Use these tools to test the application functionality. These will be removed in production.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h4 className="font-semibold text-gray-900 mb-3">Notifications</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        await createTestNotification(currentUser.uid, 
                          nearbyEmergencies.length > 0 ? nearbyEmergencies[0].id : 'testEmergencyId');
                        toast.success('Test notification created successfully!');
                      } catch (error) {
                        console.error('Error creating test notification:', error);
                        toast.error('Failed to create test notification');
                      }
                    }}
                  >
                    Create Test Notification
                  </Button>
                  
                  <Button
                    type="primary"
                    onClick={async () => {
                      try {
                        const allEmergencies = [...emergencies, ...nearbyEmergencies];
                        
                        if (allEmergencies.length === 0) {
                          return toast.error('No emergencies found. Create one first.');
                        }
                        
                        const result = await forceNotifyAllOperators(allEmergencies[0].id, currentUser.uid);
                        if (result.success) {
                          toast.success(`Notified ${result.notifiedOperators} operators about emergency ${allEmergencies[0].id.substring(0, 8)}`);
                        } else {
                          toast.error('Failed to send notifications: ' + result.error);
                        }
                      } catch (error) {
                        console.error('Error forcing notifications:', error);
                        toast.error('Failed to force notifications');
                      }
                    }}
                  >
                    Force Notify All Operators
                  </Button>
                </div>
              </Card>
              
              <Card>
                <h4 className="font-semibold text-gray-900 mb-3">Data & Debugging</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    type="success"
                    onClick={() => {
                      fetchNearbyEmergencies();
                      toast.info('Refreshed nearby emergencies list');
                    }}
                  >
                    Refresh Nearby Emergencies
                  </Button>
                  
                  <Button
                    type="primary"
                    onClick={() => {
                      console.log('Current user:', currentUser);
                      console.log('User profile:', userProfile);
                      console.log('Current user location:', userProfile?.location);
                      console.log('Nearby emergencies:', nearbyEmergencies);
                      console.log('User emergencies:', emergencies);
                      console.log('User assignments:', assignments);
                      toast.info('Debug info logged to console');
                    }}
                  >
                    Log All Debug Info
                  </Button>
                </div>
              </Card>
            </div>
          </Card>
        </div>
        
        {/* Notifications panel - right column */}
        <div className="lg:col-span-1">
          <Card 
            title={
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Notifications
              </div>
            }
            titleColor="bg-gradient-to-r from-blue-600 to-blue-700"
            titleTextColor="text-white"
            className="sticky top-4"
            footer={
              <Button
                type="text"
                onClick={() => window.location.reload()}
                className="w-full text-center"
              >
                Refresh Notifications
              </Button>
            }
          >
            {userProfile && currentUser && (
              <NotificationsList userId={currentUser.uid} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;