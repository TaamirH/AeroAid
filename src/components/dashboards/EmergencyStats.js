// src/components/dashboard/EmergencyStats.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

const EmergencyStats = ({ userId }) => {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    active: 0,
    inProgress: 0,
    responseTime: null,
    participationCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // User's emergencies
        const emergenciesRef = collection(db, 'emergencies');
        const userQuery = query(emergenciesRef, where('userId', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        // User's assignments
        const assignmentsRef = collection(db, 'searchAssignments');
        const assignmentQuery = query(assignmentsRef, where('operatorId', '==', userId));
        const assignmentSnapshot = await getDocs(assignmentQuery);
        
        // Calculate statistics
        const totalEmergencies = userSnapshot.size;
        let resolved = 0;
        let active = 0;
        let inProgress = 0;
        let totalResponseTime = 0;
        let emergenciesWithResponse = 0;
        
        userSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'resolved') resolved++;
          if (data.status === 'active') active++;
          if (data.status === 'in-progress') inProgress++;
          
          // Calculate response time if available
          if (data.createdAt && data.firstResponseAt) {
            const created = data.createdAt.toDate();
            const responded = data.firstResponseAt.toDate();
            totalResponseTime += (responded - created) / 60000; // convert to minutes
            emergenciesWithResponse++;
          }
        });
        
        setStats({
          total: totalEmergencies,
          resolved,
          active,
          inProgress,
          responseTime: emergenciesWithResponse > 0 ? 
            (totalResponseTime / emergenciesWithResponse).toFixed(1) : null,
          participationCount: assignmentSnapshot.size
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (loading) {
    return <div className="text-center py-4">Loading statistics...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Emergency Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Total Emergencies</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.active + stats.inProgress}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Participated In</p>
          <p className="text-2xl font-bold text-purple-700">{stats.participationCount}</p>
        </div>
      </div>
      
      {stats.responseTime && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">Average Response Time</p>
          <p className="text-lg font-semibold">{stats.responseTime} minutes</p>
        </div>
      )}
    </div>
  );
};

export default EmergencyStats;