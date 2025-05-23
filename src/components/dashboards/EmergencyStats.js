// src/components/dashboard/EmergencyStats.js
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";

const EmergencyStats = ({ userId }) => {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    active: 0,
    inProgress: 0,
    responseTime: null,
    participationCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    console.log("Setting up real-time stats listeners");
    setLoading(true);

    // Create query for all emergencies
    const emergenciesRef = collection(db, "emergencies");
    const allEmergenciesQuery = query(emergenciesRef);

    // Get user document for participation count
    const fetchUserParticipation = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const participatedEmergencies =
            userData.participatedEmergencies || [];

          // Update the participation count in stats
          setStats((prev) => ({
            ...prev,
            participationCount: participatedEmergencies.length,
          }));

          console.log(
            `User has participated in ${participatedEmergencies.length} emergencies`
          );
        }
      } catch (error) {
        console.error("Error fetching user participation:", error);
      }
    };

    // Fetch initial participation data
    fetchUserParticipation();

    // Set up real-time listener for user document (to track participation history)
    const userRef = doc(db, "users", userId);
    const userUnsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const participatedEmergencies =
            userData.participatedEmergencies || [];

          // Update the participation count in stats
          setStats((prev) => ({
            ...prev,
            participationCount: participatedEmergencies.length,
          }));

          console.log(
            `Updated participation count: ${participatedEmergencies.length}`
          );
        }
      },
      (error) => {
        console.error("Error in user document listener:", error);
      }
    );

    // Set up real-time listener for all emergencies
    const emergenciesUnsubscribe = onSnapshot(
      allEmergenciesQuery,
      (snapshot) => {
        console.log(`Real-time update: ${snapshot.size} total emergencies`);

        let totalEmergencies = snapshot.size;
        let resolved = 0;
        let active = 0;
        let inProgress = 0;
        let totalResponseTime = 0;
        let emergenciesWithResponse = 0;

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "resolved") resolved++;
          if (data.status === "active") active++;
          if (data.status === "in-progress") inProgress++;

          // Calculate response time if available
          if (data.createdAt && data.firstResponseAt) {
            const created = data.createdAt.toDate();
            const responded = data.firstResponseAt.toDate();
            totalResponseTime += (responded - created) / 60000; // convert to minutes
            emergenciesWithResponse++;
          }
        });

        // Update stats (except participation count which comes from user document)
        setStats((prev) => ({
          ...prev,
          total: totalEmergencies,
          resolved,
          active,
          inProgress,
          responseTime:
            emergenciesWithResponse > 0
              ? (totalResponseTime / emergenciesWithResponse).toFixed(1)
              : null,
        }));

        setLoading(false);
      },
      (error) => {
        console.error("Error in emergencies listener:", error);
        setLoading(false);
      }
    );

    // Clean up listeners on unmount
    return () => {
      emergenciesUnsubscribe();
      userUnsubscribe();
    };
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
          <p className="text-xs text-gray-500">Platform-wide</p>
        </div>

        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
          <p className="text-xs text-gray-500">Platform-wide</p>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-yellow-700">
            {stats.active + stats.inProgress}
          </p>
          <p className="text-xs text-gray-500">Platform-wide</p>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <p className="text-sm text-gray-600">Participated In</p>
          <p className="text-2xl font-bold text-purple-700">
            {stats.participationCount}
          </p>
          <p className="text-xs text-gray-500">Your activities</p>
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
