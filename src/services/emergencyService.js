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
    Timestamp
  } from 'firebase/firestore';
  import { db } from './firebase';
  import { calculateDistance } from '../utils/geoUtils';
  
  // Create a new emergency request
  export const createEmergencyRequest = async (userId, data) => {
    try {
      const emergencyData = {
        userId,
        type: data.type,
        details: data.details,
        location: new GeoPoint(data.location.latitude, data.location.longitude),
        address: data.address,
        status: 'active', // active, in-progress, resolved
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        resolvedAt: null,
        findings: []
      };
      
      const docRef = await addDoc(collection(db, 'emergencies'), emergencyData);
      
      // Find nearby drone operators (within 3km)
      await notifyNearbyOperators(docRef.id, data.location);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw error;
    }
  };
  
  // Notify nearby drone operators
  const notifyNearbyOperators = async (emergencyId, location) => {
    try {
      // Get all drone operators
      const operatorsRef = collection(db, 'users');
      const q = query(operatorsRef, where('isDroneOperator', '==', true));
      const querySnapshot = await getDocs(q);
      
      const nearbyOperators = [];
      
      querySnapshot.forEach(doc => {
        const operator = doc.data();
        if (operator.location) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            operator.location.latitude, 
            operator.location.longitude
          );
          
          // If within 3km
          if (distance <= 3) {
            nearbyOperators.push({
              id: doc.id,
              ...operator,
              distance
            });
          }
        }
      });
      
      // Create notifications for each nearby operator
      for (const operator of nearbyOperators) {
        await addDoc(collection(db, 'notifications'), {
          userId: operator.id,
          emergencyId,
          title: 'Emergency Nearby',
          message: `Emergency request ${emergencyId.substr(0, 8)} is ${operator.distance.toFixed(2)}km from your location`,
          read: false,
          createdAt: serverTimestamp()
        });
        
        // Here you would also send push notifications if tokens are available
        // This would involve using Firebase Cloud Messaging
      }
      
      return nearbyOperators.length;
    } catch (error) {
      console.error('Error notifying operators:', error);
    }
  };
  
  // Get emergency request by ID
  export const getEmergencyById = async (id) => {
    try {
      const docRef = doc(db, 'emergencies', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          resolvedAt: docSnap.data().resolvedAt?.toDate()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting emergency:', error);
      throw error;
    }
  };
  
  // Subscribe to emergency updates
  export const subscribeToEmergency = (id, callback) => {
    const docRef = doc(db, 'emergencies', id);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate()
        });
      } else {
        callback(null);
      }
    });
  };
  
  // Get user's emergency requests
  export const getUserEmergencies = async (userId) => {
    try {
      const emergenciesRef = collection(db, 'emergencies');
      const q = query(emergenciesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const emergencies = [];
      querySnapshot.forEach(doc => {
        emergencies.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          resolvedAt: doc.data().resolvedAt?.toDate()
        });
      });
      
      return emergencies;
    } catch (error) {
      console.error('Error getting user emergencies:', error);
      throw error;
    }
  };
  
  // Update emergency status
  export const updateEmergencyStatus = async (id, status) => {
    try {
      const docRef = doc(db, 'emergencies', id);
      const updateData = {
        status,
        updatedAt: serverTimestamp()
      };
      
      if (status === 'resolved') {
        updateData.resolvedAt = serverTimestamp();
      }
      
      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating emergency status:', error);
      throw error;
    }
  };
  
  // Add finding to emergency
  export const addFindingToEmergency = async (emergencyId, finding) => {
    try {
      const docRef = doc(db, 'emergencies', emergencyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const emergencyData = docSnap.data();
        const findings = emergencyData.findings || [];
        
        const newFinding = {
          id: Date.now().toString(),
          ...finding,
          timestamp: serverTimestamp()
        };
        
        findings.push(newFinding);
        
        await updateDoc(docRef, {
          findings,
          updatedAt: serverTimestamp()
        });
        
        return newFinding.id;
      } else {
        throw new Error('Emergency not found');
      }
    } catch (error) {
      console.error('Error adding finding:', error);
      throw error;
    }
  };
  