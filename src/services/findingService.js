// src/services/findingService.js

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

// Get findings for a specific emergency
export const getFindingsForEmergency = async (emergencyId) => {
  try {
    const findingsQuery = query(
      collection(db, "findings"),
      where("emergencyId", "==", emergencyId),
      orderBy("timestamp", "desc") // Most recent first
    );

    const querySnapshot = await getDocs(findingsQuery);
    const findings = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      findings.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
      });
    });

    return findings;
  } catch (error) {
    console.error("Error getting findings:", error);
    throw error;
  }
};

// Listen for realtime updates to findings for a specific emergency
export const subscribeToFindings = (emergencyId, callback) => {
  console.log(
    "Setting up subscription to findings for emergency:",
    emergencyId
  );

  const findingsQuery = query(
    collection(db, "findings"),
    where("emergencyId", "==", emergencyId),
    orderBy("timestamp", "desc") // Most recent first
  );

  return onSnapshot(
    findingsQuery,
    (snapshot) => {
      const findings = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Debug each finding data
        console.log("Raw finding data from Firestore:", {
          id: doc.id,
          ...data,
          hasLocation: !!data.location,
          locationDetails: data.location
            ? `lat: ${data.location.latitude}, lng: ${data.location.longitude}`
            : "No location",
        });

        findings.push({
          id: doc.id,
          ...data,
          // Convert the timestamp properly
          timestamp:
            data.timestamp?.toDate?.() ??
            new Date(data.timestamp) ??
            new Date(),
        });
      });

      console.log(
        `Processed ${findings.length} findings for emergency ${emergencyId}`
      );
      console.log(
        "Findings with location:",
        findings.filter((f) => f.location).length
      );

      callback(findings);
    },
    (error) => {
      console.error("Error subscribing to findings:", error);
    }
  );
};

// Add a new finding
export const addFinding = async (emergencyId, finding) => {
  try {
    console.log("Adding finding with data:", finding);

    // Make sure location is properly structured
    let locationData = null;
    if (finding.location) {
      // Ensure location has latitude and longitude as numbers
      locationData = {
        latitude: Number(finding.location.latitude),
        longitude: Number(finding.location.longitude),
      };
      console.log("Structured location data:", locationData);
    }

    // Create the finding document
    const findingData = {
      emergencyId,
      description: finding.description,
      operatorId: finding.operatorId,
      location: locationData, // Use the properly structured location
      timestamp: serverTimestamp(), // Always use serverTimestamp
      // Only include imageBase64 if it exists
      ...(finding.imageBase64 && { imageBase64: finding.imageBase64 }),
    };

    console.log("Final finding data being saved:", findingData);

    // Add to findings collection
    const findingRef = await addDoc(collection(db, "findings"), findingData);
    const findingId = findingRef.id;

    // Update the emergency document with the new finding ID
    const emergencyRef = doc(db, "emergencies", emergencyId);
    const emergencySnap = await getDoc(emergencyRef);

    if (!emergencySnap.exists()) {
      throw new Error("Emergency not found");
    }

    const emergencyData = emergencySnap.data();
    const findingIds = emergencyData.findingIds || [];

    await updateDoc(emergencyRef, {
      findingIds: [...findingIds, findingId],
      updatedAt: serverTimestamp(),
    });

    return findingId;
  } catch (error) {
    console.error("Error adding finding:", error);
    throw error;
  }
};

// Get a specific finding by ID
export const getFindingById = async (findingId) => {
  try {
    const findingRef = doc(db, "findings", findingId);
    const findingSnap = await getDoc(findingRef);

    if (findingSnap.exists()) {
      const data = findingSnap.data();
      return {
        id: findingSnap.id,
        ...data,
        timestamp: data.timestamp?.toDate(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting finding:", error);
    throw error;
  }
};
