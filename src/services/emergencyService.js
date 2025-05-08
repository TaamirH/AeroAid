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
import { acceptEmergency, getOperatorAssignments } from './searchService'; // Ensure this is imported

// Create a new emergency request without auto-assigning the creator
export const createEmergencyRequest = async (userId, data) => {
  try {
    console.log('Creating emergency request:', userId, data);
    
    // Create the emergency document
    const emergencyData = {
      userId,
      type: data.type,
      details: data.details,
      location: new GeoPoint(data.location.latitude, data.location.longitude),
      address: data.address,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
      findings: [],
      operatorId: null
    };
    
    // Use imported collection and db
    const emergenciesRef = collection(db, 'emergencies');
    const docRef = await addDoc(emergenciesRef, emergencyData);
    const emergencyId = docRef.id;
    
    console.log('Emergency created with ID:', emergencyId);
    
    // Still notify operators
    await notifyNearbyOperators(emergencyId, data.location, data.type);
    
    return emergencyId;
  } catch (error) {
    console.error('Error creating emergency request:', error);
    throw error;
  }
};


// Notify nearby drone operators with improved notification content
const notifyNearbyOperators = async (emergencyId, location, emergencyType) => {
  try {
    // Get emergency details
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
    }
    
    return nearbyOperators.length;
  } catch (error) {
    console.error('Error notifying operators:', error);
    return 0;
  }
};

// Get emergency request by ID and fetch related findings
export const getEmergencyById = async (id) => {
  try {
    const docRef = doc(db, 'emergencies', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Process the emergency data
      const processedData = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate(),
        findings: [] // Initialize empty findings array
      };
      
      // Fetch finding documents if findingIds exists
      if (data.findingIds && data.findingIds.length > 0) {
        const findingsCollection = collection(db, 'findings');
        
        // Use Promise.all to fetch all findings in parallel
        const findingPromises = data.findingIds.map(findingId => {
          const findingRef = doc(findingsCollection, findingId);
          return getDoc(findingRef).then(findingSnap => {
            if (findingSnap.exists()) {
              const findingData = findingSnap.data();
              return {
                id: findingSnap.id,
                ...findingData,
                timestamp: findingData.timestamp?.toDate()
              };
            }
            return null;
          });
        });
        
        // Wait for all finding documents to be fetched
        const findings = await Promise.all(findingPromises);
        
        // Filter out any null values (in case some findings were deleted)
        processedData.findings = findings.filter(finding => finding !== null);
        
        // Sort findings by timestamp (newest first)
        processedData.findings.sort((a, b) => {
          // Handle missing timestamps
          if (!a.timestamp) return 1;
          if (!b.timestamp) return -1;
          return b.timestamp - a.timestamp;
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

// Subscribe to emergency updates with real-time findings updates
export const subscribeToEmergency = (id, callback) => {
  // Subscribe to changes in the emergency document
  const emergencyRef = doc(db, 'emergencies', id);
  
  // Main emergency document listener
  const unsubscribeEmergency = onSnapshot(emergencyRef, async (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      
      // Process emergency data
      const processedData = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate(),
        findings: [] // Initialize empty findings array
      };
      
      try {
        // Fetch findings if findingIds exists
        if (data.findingIds && data.findingIds.length > 0) {
          const findingsCollection = collection(db, 'findings');
          
          // Use Promise.all to fetch all findings in parallel
          const findingPromises = data.findingIds.map(findingId => {
            const findingRef = doc(findingsCollection, findingId);
            return getDoc(findingRef).then(findingSnap => {
              if (findingSnap.exists()) {
                const findingData = findingSnap.data();
                return {
                  id: findingSnap.id,
                  ...findingData,
                  timestamp: findingData.timestamp?.toDate()
                };
              }
              return null;
            });
          });
          
          // Wait for all finding documents to be fetched
          const findings = await Promise.all(findingPromises);
          
          // Filter out any null values (in case some findings were deleted)
          processedData.findings = findings.filter(finding => finding !== null);
          
          // Sort findings by timestamp (newest first)
          processedData.findings.sort((a, b) => {
            // Handle missing timestamps
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp - a.timestamp;
          });
        }
        
        // Call the callback with the processed data
        callback(processedData);
      } catch (error) {
        console.error('Error fetching findings:', error);
        // Still call callback with whatever data we have
        callback(processedData);
      }
    } else {
      callback(null);
    }
  });
  
  // Also listen for changes to the findings collection for this emergency
  const findingsQuery = query(
    collection(db, 'findings'),
    where('emergencyId', '==', id)
  );
  
  // This is just a trigger to update the emergency when findings change
  // We don't use the data directly because the main emergency listener already fetches it
  const unsubscribeFindings = onSnapshot(findingsQuery, () => {
    // When a finding changes, we don't need to do anything
    // because the main emergency listener will be triggered due to the updatedAt field
    console.log('Finding collection changed for emergency:', id);
  });
  
  // Return a function to unsubscribe both listeners
  return () => {
    unsubscribeEmergency();
    unsubscribeFindings();
  };
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

// Add finding to emergency - now creates a separate document in the findings collection
export const addFindingToEmergency = async (emergencyId, finding) => {
  try {
    console.log('Adding finding to emergency:', emergencyId);
    
    // 1. Create a new document in the findings collection
    const findingData = {
      emergencyId,
      description: finding.description,
      operatorId: finding.operatorId,
      location: finding.location ? {
        latitude: finding.location.latitude,
        longitude: finding.location.longitude
      } : null,
      timestamp: serverTimestamp(),
      // Only include imageBase64 if it exists
      ...(finding.imageBase64 && { imageBase64: finding.imageBase64 })
    };
    
    const findingsCollection = collection(db, 'findings');
    const findingDocRef = await addDoc(findingsCollection, findingData);
    const findingId = findingDocRef.id;
    
    console.log('Created finding document with ID:', findingId);
    
    // 2. Update the emergency document to add the finding ID to its findingIds array
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      throw new Error('Emergency not found');
    }
    
    // Get current findingIds array or initialize it if it doesn't exist
    const emergencyData = emergencySnap.data();
    const currentFindingIds = emergencyData.findingIds || [];
    
    // Add the new finding ID to the array
    await updateDoc(emergencyRef, {
      findingIds: [...currentFindingIds, findingId],
      updatedAt: serverTimestamp()
    });
    
    console.log('Updated emergency with new finding ID');
    return findingId;
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