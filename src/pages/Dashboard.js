import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserEmergencies } from '../services/emergencyService';
import { getOperatorAssignments } from '../services/searchService';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [assignments, setAssignments] = useState([]);
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
          
          // If user is a drone operator, get their assignments
          if (userProfile?.isDroneOperator) {
            const operatorAssignments = await getOperatorAssignments(currentUser.uid);
            setAssignments(operatorAssignments);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, userProfile]);

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
                        <tr key={emergency.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(emergency.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {emergency.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {emergency.address?.substring(0, 30) || 'N/A'}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${emergency.status === 'active' ? 'bg-yellow-100 text-yellow-800' : 
                                emergency.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'}`}
                            >
                              {emergency.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(assignment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {assignment.emergencyId.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${assignment.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                                'bg-green-100 text-green-800'}`}
                            >
                              {assignment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
        </>
      )}
    </div>
  );
};

export default Dashboard;