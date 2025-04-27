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
  deleteField
} from 'firebase/firestore';
import { db } from './firebase';

// Accept emergency and create search assignment with user document syncing
export const acceptEmergency = async (emergencyId, operatorId, operatorLocation) => {
  try {
    // Check if operator already has an active assignment
    const activeAssignments = await getOperatorAssignments(operatorId, 'active');
    if (activeAssignments.length > 0) {
      throw new Error('You already have an active assignment. Please complete it before accepting another emergency.');
    }
    
    // Check if emergency exists and is active
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      throw new Error('Emergency not found');
    }
    
    const emergencyData = emergencySnap.data();
    if (emergencyData.status === 'resolved') {
      throw new Error('This emergency has already been resolved');
    }
    
    // Check if the emergency already has an operator assigned
    if (emergencyData.operatorId && emergencyData.operatorId !== operatorId) {
      throw new Error('This emergency has already been accepted by another operator.');
    }
    
    // Create a search assignment
    const searchArea = generateSearchArea(
      emergencyData.location.latitude,
      emergencyData.location.longitude,
      operatorLocation.latitude,
      operatorLocation.longitude
    );
    
    const assignmentData = {
      emergencyId,
      operatorId,
      status: 'active', // active, completed
      startLocation: new GeoPoint(operatorLocation.latitude, operatorLocation.longitude),
      searchArea,
      droneLocation: new GeoPoint(operatorLocation.latitude, operatorLocation.longitude),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null
    };
    
    const docRef = await addDoc(collection(db, 'searchAssignments'), assignmentData);
    
    // Update emergency document with the operatorId and change status
    await updateDoc(emergencyRef, {
      operatorId: operatorId,
      status: 'in-progress',
      updatedAt: serverTimestamp(),
      firstResponseAt: emergencyData.firstResponseAt || serverTimestamp() // Track when the first operator responded
    });
    
    // Update the user's document with the emergencyId
    const userRef = doc(db, 'users', operatorId);
    await updateDoc(userRef, {
      emergencyId: emergencyId,
      currentAssignmentId: docRef.id,
      lastEmergencyAccepted: serverTimestamp()
    });
    
    console.log(`Updated user ${operatorId} with emergencyId ${emergencyId} and assignmentId ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error accepting emergency:', error);
    throw error;
  }
};

// Generate search area grid based on emergency location and operator location
const generateSearchArea = (emergencyLat, emergencyLng, operatorLat, operatorLng) => {
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
      longitude: emergencyLng
    }
  };
};

// Get search assignment by ID
export const getSearchAssignmentById = async (id) => {
  try {
    const docRef = doc(db, 'searchAssignments', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
        updatedAt: docSnap.data().updatedAt?.toDate(),
        completedAt: docSnap.data().completedAt?.toDate()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting search assignment:', error);
    throw error;
  }
};

// Subscribe to search assignment updates
export const subscribeToSearchAssignment = (id, callback) => {
  const docRef = doc(db, 'searchAssignments', id);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      });
    } else {
      callback(null);
    }
  });
};

// Get operator's active search assignments
export const getOperatorAssignments = async (operatorId, status = 'active') => {
  try {
    const assignmentsRef = collection(db, 'searchAssignments');
    const q = query(
      assignmentsRef, 
      where('operatorId', '==', operatorId),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);
    
    const assignments = [];
    querySnapshot.forEach(doc => {
      assignments.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        completedAt: doc.data().completedAt?.toDate()
      });
    });
    
    return assignments;
  } catch (error) {
    console.error('Error getting operator assignments:', error);
    throw error;
  }
};

// Update drone location
export const updateDroneLocation = async (assignmentId, location) => {
  try {
    const docRef = doc(db, 'searchAssignments', assignmentId);
    await updateDoc(docRef, {
      droneLocation: new GeoPoint(location.latitude, location.longitude),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating drone location:', error);
    throw error;
  }
};

// Complete search assignment with user document syncing
export const completeSearchAssignment = async (assignmentId) => {
  try {
    console.log('Completing assignment:', assignmentId);
    const assignmentRef = doc(db, 'searchAssignments', assignmentId);
    
    // Check if the document exists first
    const assignmentSnap = await getDoc(assignmentRef);
    if (!assignmentSnap.exists()) {
      throw new Error('Assignment not found');
    }
    
    const assignmentData = assignmentSnap.data();
    
    // Update the assignment
    await updateDoc(assignmentRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Clear the operatorId from the emergency document if this was the assigned operator
    // (Only if the emergency isn't resolved yet)
    const emergencyRef = doc(db, 'emergencies', assignmentData.emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (emergencySnap.exists()) {
      const emergencyData = emergencySnap.data();
      
      if (emergencyData.status !== 'resolved' && 
          emergencyData.operatorId === assignmentData.operatorId) {
        await updateDoc(emergencyRef, {
          operatorId: null,
          status: 'active', // Set back to active so another operator can accept it
          updatedAt: serverTimestamp()
        });
        console.log(`Cleared operatorId from emergency ${assignmentData.emergencyId}`);
      }
    }
    
    // Clear the emergency ID from the user's document
    const userRef = doc(db, 'users', assignmentData.operatorId);
    await updateDoc(userRef, {
      emergencyId: deleteField(),
      currentAssignmentId: deleteField(),
    });
    
    console.log(`Cleared emergencyId and currentAssignmentId from user ${assignmentData.operatorId}`);
    console.log('Assignment completed successfully');
    
    return true;
  } catch (error) {
    console.error('Error completing assignment:', error);
    throw error; // Re-throw to be handled by caller
  }
};