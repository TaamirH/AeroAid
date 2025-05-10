//src/services/searchService.js
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
  GeoPoint,
  deleteField,
} from "firebase/firestore";
import { db } from "./firebase";

// Accept emergency and create search assignment with user document syncing
export const acceptEmergency = async (
  emergencyId,
  operatorId,
  operatorLocation
) => {
  try {
    // Check if operator already has an active assignment
    const activeAssignments = await getOperatorAssignments(
      operatorId,
      "active"
    );
    if (activeAssignments.length > 0) {
      throw new Error(
        "You already have an active assignment. Please complete it before accepting another emergency."
      );
    }

    // Check if emergency exists and is active
    const emergencyRef = doc(db, "emergencies", emergencyId);
    const emergencySnap = await getDoc(emergencyRef);

    if (!emergencySnap.exists()) {
      throw new Error("Emergency not found");
    }

    const emergencyData = emergencySnap.data();
    if (emergencyData.status === "resolved") {
      throw new Error("This emergency has already been resolved");
    }

    // Check if the emergency already has an operator assigned
    if (emergencyData.operatorId && emergencyData.operatorId !== operatorId) {
      throw new Error(
        "This emergency has already been accepted by another operator."
      );
    }

    // Find existing search assignment for this emergency
    const assignmentsRef = collection(db, "searchAssignments");
    const q = query(
      assignmentsRef,
      where("emergencyId", "==", emergencyId),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    let assignmentId;

    if (querySnapshot.empty) {
      // If no assignment exists (this shouldn't happen with the new flow), create one
      console.log("No existing assignment found, creating new one");
      const searchArea = generateSearchArea(
        emergencyData.location.latitude,
        emergencyData.location.longitude,
        operatorLocation.latitude,
        operatorLocation.longitude
      );

      const assignmentData = {
        emergencyId,
        operatorId,
        status: "active",
        startLocation: new GeoPoint(
          operatorLocation.latitude,
          operatorLocation.longitude
        ),
        searchArea,
        droneLocation: new GeoPoint(
          operatorLocation.latitude,
          operatorLocation.longitude
        ),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
      };

      const docRef = await addDoc(
        collection(db, "searchAssignments"),
        assignmentData
      );
      assignmentId = docRef.id;
    } else {
      // Update the existing assignment with the operator's info
      console.log("Found existing assignment, updating with operator details");
      const assignmentDoc = querySnapshot.docs[0];
      assignmentId = assignmentDoc.id;

      await updateDoc(doc(db, "searchAssignments", assignmentId), {
        operatorId,
        startLocation: new GeoPoint(
          operatorLocation.latitude,
          operatorLocation.longitude
        ),
        droneLocation: new GeoPoint(
          operatorLocation.latitude,
          operatorLocation.longitude
        ),
        updatedAt: serverTimestamp(),
      });
    }

    // Update emergency document with the operatorId and change status
    await updateDoc(emergencyRef, {
      operatorId: operatorId,
      status: "in-progress",
      updatedAt: serverTimestamp(),
      firstResponseAt: emergencyData.firstResponseAt || serverTimestamp(), // Track when the first operator responded
    });

    // Update the user's document with the emergencyId
    const userRef = doc(db, "users", operatorId);
    await updateDoc(userRef, {
      emergencyId: emergencyId,
      currentAssignmentId: assignmentId,
      lastEmergencyAccepted: serverTimestamp(),
    });

    console.log(
      `Updated user ${operatorId} with emergencyId ${emergencyId} and assignmentId ${assignmentId}`
    );

    return assignmentId;
  } catch (error) {
    console.error("Error accepting emergency:", error);
    throw error;
  }
};

// Generate search area grid based on emergency location and operator location
const generateSearchArea = (
  emergencyLat,
  emergencyLng,
  operatorLat,
  operatorLng
) => {
  // This is a simplified version
  // In a real-world scenario, you'd want to create a more sophisticated algorithm
  // to divide the area into search grids based on the number of operators

  // For this example, we'll create a simple grid around the emergency location
  const gridSize = 0.003; // Roughly 300 meters

  return {
    north: emergencyLat + gridSize,
    south: emergencyLat - gridSize,
    east: emergencyLng + gridSize,
    west: emergencyLng - gridSize,
    center: {
      latitude: emergencyLat,
      longitude: emergencyLng,
    },
  };
};

// Get search assignment by ID
export const getSearchAssignmentById = async (id) => {
  try {
    const docRef = doc(db, "searchAssignments", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        completedAt: docSnap.data().completedAt?.toDate(),
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting search assignment:", error);
    throw error;
  }
};

// Subscribe to search assignment updates
export const subscribeToSearchAssignment = (id, callback) => {
  const docRef = doc(db, "searchAssignments", id);

  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      });
    } else {
      callback(null);
    }
  });
};

// Get operator's active search assignments
export const getOperatorAssignments = async (operatorId, status = "active") => {
  try {
    const assignmentsRef = collection(db, "searchAssignments");
    const q = query(
      assignmentsRef,
      where("operatorId", "==", operatorId),
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(q);

    const assignments = [];
    querySnapshot.forEach((doc) => {
      assignments.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate(),
      });
    });

    return assignments;
  } catch (error) {
    console.error("Error getting operator assignments:", error);
    throw error;
  }
};

// Update drone location
export const updateDroneLocation = async (assignmentId, location) => {
  try {
    const docRef = doc(db, "searchAssignments", assignmentId);
    await updateDoc(docRef, {
      droneLocation: new GeoPoint(location.latitude, location.longitude),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating drone location:", error);
    throw error;
  }
};

// Complete search assignment with user document syncing
export const completeSearchAssignment = async (assignmentId) => {
  try {
    console.log("Completing assignment:", assignmentId);
    const assignmentRef = doc(db, "searchAssignments", assignmentId);

    // Check if the document exists first
    const assignmentSnap = await getDoc(assignmentRef);
    if (!assignmentSnap.exists()) {
      throw new Error("Assignment not found");
    }

    const assignmentData = assignmentSnap.data();
    const operatorId = assignmentData.operatorId;

    if (!operatorId) {
      throw new Error("No operator associated with this assignment");
    }

    // Update the assignment with completed status and clear the operatorId
    await updateDoc(assignmentRef, {
      status: "completed",
      operatorId: null, // Clear the operatorId
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(
      `Updated assignment ${assignmentId} to completed and cleared operatorId`
    );

    // Get the related emergency
    const emergencyRef = doc(db, "emergencies", assignmentData.emergencyId);
    const emergencySnap = await getDoc(emergencyRef);

    if (emergencySnap.exists()) {
      const emergencyData = emergencySnap.data();

      // Check if there are any other active assignments for this emergency
      const assignmentsRef = collection(db, "searchAssignments");
      const otherAssignmentsQuery = query(
        assignmentsRef,
        where("emergencyId", "==", assignmentData.emergencyId),
        where("status", "==", "active"),
        where("__name__", "!=", assignmentId) // Exclude the current assignment
      );

      const otherAssignmentsSnap = await getDocs(otherAssignmentsQuery);

      // If there are no other active assignments, update the emergency status
      if (otherAssignmentsSnap.empty) {
        // If the emergency isn't already resolved, update its status and clear operatorId
        if (emergencyData.status !== "resolved") {
          await updateDoc(emergencyRef, {
            status: "completed", // New status to show work is done but not yet resolved
            operatorId: null, // Clear the operatorId from the emergency
            updatedAt: serverTimestamp(),
          });
          console.log(
            `Updated emergency ${assignmentData.emergencyId} status to 'completed' and cleared operatorId`
          );
        }
      } else {
        // If this was the assigned operator, clear the operator
        if (emergencyData.operatorId === operatorId) {
          await updateDoc(emergencyRef, {
            operatorId: null,
            updatedAt: serverTimestamp(),
          });
          console.log(
            `Cleared operatorId from emergency ${assignmentData.emergencyId}`
          );
        }
      }
    } else {
      console.warn(
        `Emergency ${assignmentData.emergencyId} not found when completing assignment`
      );
    }

    // Clear the emergency ID from the user's document
    const userRef = doc(db, "users", operatorId);
    await updateDoc(userRef, {
      emergencyId: deleteField(),
      currentAssignmentId: deleteField(),
      lastCompletedAssignmentId: assignmentId, // Optional: track last completed assignment
      lastCompletedAt: serverTimestamp(), // Optional: track completion time
    });

    console.log(
      `Cleared emergencyId and currentAssignmentId from user ${operatorId}`
    );
    console.log("Assignment completed successfully");

    return true;
  } catch (error) {
    console.error("Error completing assignment:", error);
    throw error; // Re-throw to be handled by caller
  }
};
