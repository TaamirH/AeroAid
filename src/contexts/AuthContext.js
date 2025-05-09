// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName, isDroneOperator, location) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName,
        email,
        isDroneOperator,
        location,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        notificationToken: null
      });
      
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateUserProfile(userId, data) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      lastActive: new Date().toISOString()
    });
    
    // Update local profile
    setUserProfile(prev => ({
      ...prev,
      ...data
    }));
  }

  async function fetchUserProfile(userId) {
    try {
      console.log('Fetching user profile for ID:', userId);
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('User profile data retrieved:', userData);
        
        // If the user has an emergencyId but no assignment, we should verify
        if (userData.emergencyId && userData.currentAssignmentId) {
          try {
            // Check if the assignment still exists and is active
            const assignmentRef = doc(db, 'searchAssignments', userData.currentAssignmentId);
            const assignmentSnap = await getDoc(assignmentRef);
            
            if (!assignmentSnap.exists() || assignmentSnap.data().status !== 'active') {
              // Assignment doesn't exist or is not active anymore, clear the fields
              console.log('Clearing stale emergency assignment data');
              await updateDoc(userRef, {
                emergencyId: deleteField(),
                currentAssignmentId: deleteField()
              });
              
              // Update the user data before returning
              userData.emergencyId = null;
              userData.currentAssignmentId = null;
            }
          } catch (verifyError) {
            console.error('Error verifying assignment:', verifyError);
            // Don't block the profile fetch if this check fails
          }
        }
        
        setUserProfile(userData);
        return userData;
      } else {
        console.log('No user profile found, creating a default one');
        // Create a default profile if none exists
        const defaultProfile = {
          displayName: currentUser?.displayName || '',
          email: currentUser?.email || '',
          isDroneOperator: false,
          location: null,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          emergencyId: null,
          currentAssignmentId: null
        };
        
        // Save the default profile to Firestore
        await setDoc(userRef, defaultProfile);
        
        // Set the profile in the state
        setUserProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Set a default profile even on error to prevent endless loading
      const fallbackProfile = {
        displayName: currentUser?.displayName || '',
        email: currentUser?.email || '',
        isDroneOperator: false,
        location: null,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        emergencyId: null,
        currentAssignmentId: null,
        error: true
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}