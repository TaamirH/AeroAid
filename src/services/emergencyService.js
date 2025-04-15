// File: src/services/emergencyService.js
// Updated emergency service with better notification handling
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
import { acceptEmergency } from './searchService';


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
    const emergencyId = docRef.id;
    
    // Find nearby drone operators
    await notifyNearbyOperators(emergencyId, data.location, data.type);
    
    // Auto-assign the creator to this emergency
    // Only if the creator is a drone operator
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && userSnap.data().isDroneOperator) {
        console.log('Creator is a drone operator, auto-assigning...');
        
        // Use the same location for the assignment
        const assignmentId = await acceptEmergency(
          emergencyId, 
          userId, 
          data.location
        );
        
        console.log('Created assignment for creator:', assignmentId);
        
        // Update emergency status to in-progress
        await updateDoc(docRef, {
          status: 'in-progress',
          updatedAt: serverTimestamp()
        });
      }
    } catch (assignError) {
      console.error('Error auto-assigning creator:', assignError);
      // Don't throw here - we want the emergency to be created even if assignment fails
    }
    
    return emergencyId;
  } catch (error) {
    console.error('Error creating emergency request:', error);
    throw error;
  }
};

// Notify nearby drone operators with improved notification content
const notifyNearbyOperators = async (emergencyId, location, emergencyType) => {
  try {
    // Get emergency details to include in notification
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      console.error('Emergency not found for notification:', emergencyId);
      return 0;
    }
    
    const emergencyData = emergencySnap.data();
    
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
    
    console.log(`Notifying ${nearbyOperators.length} nearby operators about emergency ${emergencyId}`);
    
    // Create notifications for each nearby operator
    for (const operator of nearbyOperators) {
      const shortEmergencyId = emergencyId.substring(0, 8);
      
      // Create a notification in Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: operator.id,
        emergencyId,
        title: `${emergencyType} Emergency Nearby`,
        message: `Emergency request #${shortEmergencyId} is ${operator.distance.toFixed(2)}km from your location. Your help is needed!`,
        read: false,
        createdAt: serverTimestamp()
      });
      
      console.log(`Created notification for operator ${operator.id}`);
      
      // If the operator has a notification token, send a push notification
      if (operator.notificationToken) {
        try {
          // This is a placeholder - in a real implementation, you would use Firebase Admin SDK
          // or a server endpoint to send the actual push notification
          console.log(`Would send push notification to token ${operator.notificationToken}`);
        } catch (error) {
          console.error('Error sending push notification:', error);
        }
      }
    }
    
    return nearbyOperators.length;
  } catch (error) {
    console.error('Error notifying operators:', error);
    return 0;
  }
};

// Get emergency request by ID
export const getEmergencyById = async (id) => {
  try {
    const docRef = doc(db, 'emergencies', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Process the data
      const processedData = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate()
      };
      
      // Ensure findings data structure is maintained
      if (Array.isArray(processedData.findings)) {
        processedData.findings.forEach(finding => {
          // Make sure imageBase64 is preserved if it exists
          if (finding.imageBase64) {
            finding.imageBase64 = finding.imageBase64;
          }
        });
      }
      
      return processedData;
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
    console.log('Adding finding to emergency:', emergencyId);
    const docRef = doc(db, 'emergencies', emergencyId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const emergencyData = docSnap.data();
      const findings = Array.isArray(emergencyData.findings) ? emergencyData.findings : [];
      
      // Create a new finding with ID
      const newFinding = {
        id: Date.now().toString(),
        ...finding,
        timestamp: new Date().toISOString()
      };
      
      console.log('New finding data being added:', newFinding);
      
      // Add the new finding to the findings array
      findings.push(newFinding);
      
      // Update the emergency document with the new findings array
      await updateDoc(docRef, {
        findings,
        updatedAt: serverTimestamp()
      });
      
      console.log('Finding added successfully');
      return newFinding.id;
    } else {
      throw new Error('Emergency not found');
    }
  } catch (error) {
    console.error('Error adding finding:', error);
    throw error;
  }
};


export const createTestEmergencyForNotifications = async (creatorId, location, notify = true) => {
  try {
    // Create a test emergency
    const emergencyData = {
      userId: creatorId,
      type: 'Test Emergency',
      details: 'This is a test emergency to verify notifications.',
      location: new GeoPoint(location.latitude, location.longitude),
      address: 'Test Address',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
      findings: []
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'emergencies'), emergencyData);
    console.log('Created test emergency with ID:', docRef.id);
    
    // Initialize the notified count
    let notifiedCount = 0;
    
    // Notify operators if requested
    if (notify) {
      // Get all drone operators EXCEPT the creator
      const operatorsRef = collection(db, 'users');
      const q = query(
        operatorsRef, 
        where('isDroneOperator', '==', true),
        where('__name__', '!=', creatorId) // Exclude the creator
      );
      
      const querySnapshot = await getDocs(q);
      const operators = [];
      
      querySnapshot.forEach(doc => {
        operators.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      notifiedCount = operators.length;
      console.log(`Found ${notifiedCount} drone operators to notify`);
      
      // Create a notification for each operator
      for (const operator of operators) {
        await addDoc(collection(db, 'notifications'), {
          userId: operator.id,
          emergencyId: docRef.id,
          title: 'Test Emergency Nearby',
          message: 'A test emergency was created to verify the notification system.',
          read: false,
          createdAt: serverTimestamp()
        });
        
        console.log(`Created notification for operator ${operator.id}`);
      }
    }
    
    return {
      success: true,
      emergencyId: docRef.id,
      notifiedOperators: notifiedCount
    };
  } catch (error) {
    console.error('Error creating test emergency:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced notification function to ensure all operators receive notifications
export const forceNotifyAllOperators = async (emergencyId, currentUserId) => {
  try {
    // Get emergency details
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      throw new Error('Emergency not found');
    }
    
    const emergencyData = emergencySnap.data();
    
    // Log the current user for debugging
    console.log("Current user forcing notifications:", currentUserId);
    
    // Get ALL drone operators including the creator for testing
    const operatorsRef = collection(db, 'users');
    const q = query(
      operatorsRef, 
      where('isDroneOperator', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const operators = [];
    
    querySnapshot.forEach(doc => {
      operators.push({
        id: doc.id,
        ...doc.data()
      });
      console.log("Found operator:", doc.id, doc.data().displayName || "No name");
    });
    
    console.log(`Found ${operators.length} drone operators for forced notification`);
    
    // Create a notification for each operator
    let createdCount = 0;
    for (const operator of operators) {
      // Skip creating notification for the current user if desired
      // if (operator.id === currentUserId) continue;
      
      // Create a notification with additional debugging info
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        userId: operator.id,
        emergencyId: emergencyId,
        title: 'Emergency Needs Attention',
        message: `Emergency #${emergencyId.substring(0, 8)} requires drone operator assistance.`,
        read: false,
        createdAt: serverTimestamp(),
        debug: {
          createdBy: currentUserId,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`Created notification ${notificationRef.id} for operator ${operator.id}`);
      createdCount++;
    }
    
    return {
      success: true,
      notifiedOperators: createdCount
    };
  } catch (error) {
    console.error('Error forcing notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};