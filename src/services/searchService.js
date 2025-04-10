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
    GeoPoint 
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Accept emergency and create search assignment
  export const acceptEmergency = async (emergencyId, operatorId, operatorLocation) => {
    try {
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
      
      // Update emergency status if it's the first assignment
      if (emergencyData.status === 'active') {
        await updateDoc(emergencyRef, {
          status: 'in-progress',
          updatedAt: serverTimestamp()
        });
      }
      
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
  
  // Complete search assignment
  export const completeSearchAssignment = async (assignmentId) => {
    try {
      const docRef = doc(db, 'searchAssignments', assignmentId);
      await updateDoc(docRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error completing assignment:', error);
      throw error;
    }
  };
  