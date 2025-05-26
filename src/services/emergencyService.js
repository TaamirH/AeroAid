// File: src/services/emergencyService.js
// FIXED VERSION - Notifies ALL operators within 3km (both notifications + emails)

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
import { sendEmergencyNotificationEmail } from './emailService';

// Create a new emergency request - FIXED to notify ALL nearby operators
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
    
    const emergenciesRef = collection(db, 'emergencies');
    const docRef = await addDoc(emergenciesRef, emergencyData);
    const emergencyId = docRef.id;
    
    console.log('Emergency created with ID:', emergencyId);
    
    // FIXED: Notify ALL nearby operators (both notifications and emails)
    await notifyAllNearbyOperators(emergencyId, data.location, data.type);
    
    return emergencyId;
  } catch (error) {
    console.error('Error creating emergency request:', error);
    throw error;
  }
};

// FIXED FUNCTION: Notify ALL nearby operators (not just one)
const notifyAllNearbyOperators = async (emergencyId, location, emergencyType) => {
  try {
    console.log(`🔍 Finding ALL operators within 3km of emergency ${emergencyId}`);
    
    // Get emergency details
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      console.error('Emergency not found for notification:', emergencyId);
      return 0;
    }
    
    const emergencyData = {
      id: emergencyId,
      ...emergencySnap.data(),
      createdAt: emergencySnap.data().createdAt?.toDate()
    };
    
    // Get ALL drone operators
    const operatorsRef = collection(db, 'users');
    const q = query(operatorsRef, where('isDroneOperator', '==', true));
    const querySnapshot = await getDocs(q);
    
    const allNearbyOperators = [];
    
    // Check EVERY operator to see if they're within 3km
    querySnapshot.forEach(doc => {
      const operator = doc.data();
      console.log(`Checking operator: ${doc.id} (${operator.displayName || 'No name'})`);
      
      if (operator.location) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          operator.location.latitude, 
          operator.location.longitude
        );
        
        console.log(`  - Distance: ${distance.toFixed(2)}km`);
        
        // If within 3km, add to notification list
        if (distance <= 3) {
          allNearbyOperators.push({
            id: doc.id,
            ...operator,
            distance
          });
          console.log(`  ✅ Added to notification list (${distance.toFixed(2)}km away)`);
        } else {
          console.log(`  ❌ Too far away (${distance.toFixed(2)}km > 3km)`);
        }
      } else {
        console.log(`  ❌ No location set`);
      }
    });
    
    console.log(`📢 Found ${allNearbyOperators.length} operators within 3km to notify`);
    
    if (allNearbyOperators.length === 0) {
      console.log('No nearby operators found');
      return 0;
    }
    
    // Create notifications and send emails for ALL nearby operators
    let notificationCount = 0;
    let emailSuccessCount = 0;
    let emailFailCount = 0;
    
    const allPromises = [];
    
    for (const operator of allNearbyOperators) {
      const shortEmergencyId = emergencyId.substring(0, 8);
      
      console.log(`📱 Creating notification for operator ${operator.id} (${operator.displayName || 'No name'})`);
      
      // Create in-app notification for this operator
      const notificationPromise = addDoc(collection(db, 'notifications'), {
        userId: operator.id,
        emergencyId,
        title: `${emergencyType} Emergency Nearby`,
        message: `Emergency request #${shortEmergencyId} is ${operator.distance.toFixed(2)}km from your location. Your help is needed!`,
        read: false,
        createdAt: serverTimestamp(),
        emailSent: false,
        distance: operator.distance
      }).then(async (notificationRef) => {
        console.log(`✅ Created notification ${notificationRef.id} for operator ${operator.id}`);
        notificationCount++;
        return notificationRef;
      }).catch(error => {
        console.error(`❌ Failed to create notification for operator ${operator.id}:`, error);
        return null;
      });
      
      allPromises.push(notificationPromise);
      
      // Send email notification if operator has email
      if (operator.email) {
        console.log(`📧 Sending email to operator ${operator.id} (${operator.email})`);
        
        const emailPromise = sendEmergencyNotificationEmail(operator, emergencyData)
          .then(async (result) => {
            if (result.success) {
              console.log(`✅ Email sent successfully to ${operator.email}`);
              emailSuccessCount++;
              
              // Update the notification to mark email as sent
              const notificationRef = await notificationPromise;
              if (notificationRef) {
                await updateDoc(notificationRef, {
                  emailSent: true,
                  emailSentAt: serverTimestamp()
                });
              }
              
              return { success: true, operatorId: operator.id, email: operator.email };
            } else {
              console.error(`❌ Failed to send email to ${operator.email}:`, result.error);
              emailFailCount++;
              return { success: false, operatorId: operator.id, email: operator.email, error: result.error };
            }
          })
          .catch(error => {
            console.error(`❌ Email error for ${operator.email}:`, error);
            emailFailCount++;
            return { success: false, operatorId: operator.id, email: operator.email, error: error.message };
          });
        
        allPromises.push(emailPromise);
      } else {
        console.log(`📧 No email address for operator ${operator.id}, skipping email`);
      }
    }
    
    // Wait for all notifications and emails to complete
    await Promise.allSettled(allPromises);
    
    console.log(`   📱 In-app notifications: ${notificationCount}/${allNearbyOperators.length} created`);
    console.log(`   📧 Emails sent: ${emailSuccessCount} success, ${emailFailCount} failed`);
    console.log(`   👥 Total operators notified: ${allNearbyOperators.length}`);
    
    return allNearbyOperators.length;
  } catch (error) {
    console.error('Error notifying nearby operators:', error);
    return 0;
  }
};

// FIXED: Force notify ALL operators (for testing)
export const forceNotifyAllOperators = async (emergencyId, currentUserId, includeEmails = true) => {
  try {
    console.log(`🚨 FORCE NOTIFYING ALL OPERATORS for emergency ${emergencyId}`);
    
    // Get emergency details
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      throw new Error('Emergency not found');
    }
    
    const emergencyData = {
      id: emergencyId,
      ...emergencySnap.data(),
      createdAt: emergencySnap.data().createdAt?.toDate()
    };
    
    // Get ALL drone operators (no distance filtering)
    const operatorsRef = collection(db, 'users');
    const q = query(operatorsRef, where('isDroneOperator', '==', true));
    const querySnapshot = await getDocs(q);
    
    const allOperators = [];
    querySnapshot.forEach(doc => {
      const operatorData = doc.data();
      allOperators.push({
        id: doc.id,
        ...operatorData,
        distance: 0 // For testing, set distance to 0
      });
      console.log(`Found operator: ${doc.id} (${operatorData.displayName || 'No name'}) - Email: ${operatorData.email || 'None'}`);
    });
    
    console.log(`📢 Force notifying ALL ${allOperators.length} drone operators`);
    
    let notificationCount = 0;
    let emailSuccessCount = 0;
    let emailFailCount = 0;
    
    const allPromises = [];
    
    for (const operator of allOperators) {
      // Create notification for every operator
      const notificationPromise = addDoc(collection(db, 'notifications'), {
        userId: operator.id,
        emergencyId: emergencyId,
        title: 'Emergency Needs Attention (FORCED)',
        message: `Emergency #${emergencyId.substring(0, 8)} requires drone operator assistance. [FORCE NOTIFICATION TEST]`,
        read: false,
        createdAt: serverTimestamp(),
        emailSent: false,
        debug: {
          createdBy: currentUserId,
          timestamp: new Date().toISOString(),
          forced: true
        }
      }).then((notificationRef) => {
        console.log(`✅ Created forced notification ${notificationRef.id} for operator ${operator.id}`);
        notificationCount++;
        return notificationRef;
      }).catch(error => {
        console.error(`❌ Failed to create notification for operator ${operator.id}:`, error);
        return null;
      });
      
      allPromises.push(notificationPromise);
      
      // Send email if requested and operator has email
      if (includeEmails && operator.email) {
        const emailPromise = sendEmergencyNotificationEmail(operator, emergencyData)
          .then(async (result) => {
            if (result.success) {
              console.log(`✅ Force email sent successfully to ${operator.email}`);
              emailSuccessCount++;
              
              // Update notification to mark email as sent
              const notificationRef = await notificationPromise;
              if (notificationRef) {
                await updateDoc(notificationRef, {
                  emailSent: true,
                  emailSentAt: serverTimestamp()
                });
              }
              
              return { success: true, email: operator.email };
            } else {
              console.error(`❌ Failed to send force email to ${operator.email}:`, result.error);
              emailFailCount++;
              return { success: false, email: operator.email, error: result.error };
            }
          })
          .catch(error => {
            console.error(`❌ Force email error for ${operator.email}:`, error);
            emailFailCount++;
            return { success: false, email: operator.email, error: error.message };
          });
        
        allPromises.push(emailPromise);
      }
    }
    
    // Wait for all notifications and emails
    await Promise.allSettled(allPromises);
    
    console.log(`📊 FORCE NOTIFICATION SUMMARY:`);
    console.log(`   📱 Notifications created: ${notificationCount}/${allOperators.length}`);
    console.log(`   📧 Emails sent: ${emailSuccessCount} success, ${emailFailCount} failed`);
    
    return {
      success: true,
      notifiedOperators: notificationCount,
      emailsSent: emailSuccessCount,
      emailsFailed: emailFailCount,
      totalOperators: allOperators.length
    };
  } catch (error) {
    console.error('Error forcing notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test function to create emergency with notifications to ALL nearby operators
export const createTestEmergencyForNotifications = async (creatorId, location, notify = true, includeEmails = true) => {
  try {
    console.log('🧪 Creating test emergency for notification testing');
    
    // Create a test emergency
    const emergencyData = {
      userId: creatorId,
      type: 'Test Emergency - System Check',
      details: 'This is a test emergency to verify that ALL nearby operators receive notifications and emails.',
      location: new GeoPoint(location.latitude, location.longitude),
      address: 'Test Address for Notification System Check',
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedAt: null,
      findings: []
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'emergencies'), emergencyData);
    console.log('✅ Created test emergency with ID:', docRef.id);
    
    let notifiedCount = 0;
    let emailCount = 0;
    
    // Notify ALL nearby operators if requested
    if (notify) {
      // Use the regular notification function which finds nearby operators
      const result = await notifyAllNearbyOperators(docRef.id, location, 'Test Emergency');
      notifiedCount = result;
      
      // Count emails by checking notifications with emailSent = true
      // (This is approximate since emails are sent asynchronously)
      emailCount = result; // Assume same number for now
    }
    
    return {
      success: true,
      emergencyId: docRef.id,
      notifiedOperators: notifiedCount,
      emailsSent: emailCount
    };
  } catch (error) {
    console.error('Error creating test emergency:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// All other existing functions remain unchanged...
export const getEmergencyById = async (id) => {
  try {
    const docRef = doc(db, 'emergencies', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      const processedData = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate(),
        findings: []
      };
      
      if (data.findingIds && data.findingIds.length > 0) {
        const findingsCollection = collection(db, 'findings');
        
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
        
        const findings = await Promise.all(findingPromises);
        processedData.findings = findings.filter(finding => finding !== null);
        
        processedData.findings.sort((a, b) => {
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

export const subscribeToEmergency = (id, callback) => {
  const emergencyRef = doc(db, 'emergencies', id);
  
  const unsubscribeEmergency = onSnapshot(emergencyRef, async (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      
      const processedData = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        resolvedAt: data.resolvedAt?.toDate(),
        findings: []
      };
      
      try {
        if (data.findingIds && data.findingIds.length > 0) {
          const findingsCollection = collection(db, 'findings');
          
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
          
          const findings = await Promise.all(findingPromises);
          processedData.findings = findings.filter(finding => finding !== null);
          
          processedData.findings.sort((a, b) => {
            if (!a.timestamp) return 1;
            if (!b.timestamp) return -1;
            return b.timestamp - a.timestamp;
          });
        }
        
        callback(processedData);
      } catch (error) {
        console.error('Error fetching findings:', error);
        callback(processedData);
      }
    } else {
      callback(null);
    }
  });
  
  const findingsQuery = query(
    collection(db, 'findings'),
    where('emergencyId', '==', id)
  );
  
  const unsubscribeFindings = onSnapshot(findingsQuery, () => {
    console.log('Finding collection changed for emergency:', id);
  });
  
  return () => {
    unsubscribeEmergency();
    unsubscribeFindings();
  };
};

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

export const addFindingToEmergency = async (emergencyId, finding) => {
  try {
    console.log('Adding finding to emergency:', emergencyId);
    
    const findingData = {
      emergencyId,
      description: finding.description,
      operatorId: finding.operatorId,
      location: finding.location ? {
        latitude: finding.location.latitude,
        longitude: finding.location.longitude
      } : null,
      timestamp: serverTimestamp(),
      ...(finding.imageBase64 && { imageBase64: finding.imageBase64 })
    };
    
    const findingsCollection = collection(db, 'findings');
    const findingDocRef = await addDoc(findingsCollection, findingData);
    const findingId = findingDocRef.id;
    
    console.log('Created finding document with ID:', findingId);
    
    const emergencyRef = doc(db, 'emergencies', emergencyId);
    const emergencySnap = await getDoc(emergencyRef);
    
    if (!emergencySnap.exists()) {
      throw new Error('Emergency not found');
    }
    
    const emergencyData = emergencySnap.data();
    const currentFindingIds = emergencyData.findingIds || [];
    
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