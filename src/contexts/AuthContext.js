// src/contexts/AuthContext.js - Clean version with better error handling
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteField,
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { notifyOperatorOfNearbyEmergencies } from "../services/notificationService";
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get the correct continue URL based on current domain
  const getContinueUrl = () => {
    const currentDomain = window.location.origin;
    return `${currentDomain}/verify-email`;
  };

  // IMPROVED SIGNUP FUNCTION with better error handling
  async function signup(
    email,
    password,
    displayName,
    isDroneOperator,
    location
  ) {
    let userCredential = null;
    let profileCreated = false;
    
    try {
      console.log('🚀 Starting registration process for:', email);
      
      // Step 1: Create user account in Firebase Auth
      console.log('📝 Creating Firebase Auth user...');
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      console.log('✅ Firebase Auth user created:', userCredential.user.uid);
      
      // Step 2: Update the user's display name
      console.log('👤 Updating user profile...');
      await updateProfile(userCredential.user, { displayName });
      console.log('✅ Display name updated');
      
      // Step 3: Create user profile document in Firestore
      console.log('📄 Creating Firestore profile document...');
      const profileData = {
        displayName,
        email,
        isDroneOperator,
        location,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        notificationToken: null,
        emailVerified: false,
      };

      await setDoc(doc(db, "users", userCredential.user.uid), profileData);
      profileCreated = true;
      console.log('✅ Firestore profile created');
      
      // Step 4: Send verification email
      console.log('📧 Sending verification email...');
      await sendEmailVerification(userCredential.user, {
        url: getContinueUrl()
      });
      console.log('✅ Verification email sent');
      toast.success(`Email verification sent to: ${email}`);

      // Step 5: Set the userProfile state
      setUserProfile(profileData);

      // Step 6: Notify about nearby emergencies (async, non-blocking)
      if (isDroneOperator && location) {
        console.log('🔔 Scheduling nearby emergency notifications...');
        // Do this asynchronously - don't await, don't let it fail the registration
        notifyOperatorOfNearbyEmergencies(userCredential.user.uid, location)
          .then((result) => {
            console.log(
              `✅ Notified new operator of ${result.count} nearby emergencies`
            );
          })
          .catch((error) => {
            console.error("⚠️ Error notifying about nearby emergencies (non-critical):", error);
            // Don't fail the registration for this
          });
      }

      console.log('🎉 Registration completed successfully!');
      return userCredential.user;
      
    } catch (error) {
      console.error('❌ Registration failed at some step:', error);
      
      // CLEANUP: If anything failed, clean up what we created
      if (userCredential && userCredential.user) {
        console.log('🧹 Cleaning up failed registration...');
        
        try {
          // Delete the Firestore profile if it was created
          if (profileCreated) {
            console.log('🗑️ Deleting Firestore profile...');
            await deleteDoc(doc(db, "users", userCredential.user.uid));
            console.log('✅ Firestore profile deleted');
          }
          
          // Delete the Firebase Auth user
          console.log('🗑️ Deleting Firebase Auth user...');
          await deleteUser(userCredential.user);
          console.log('✅ Firebase Auth user deleted');
          
        } catch (cleanupError) {
          console.error('⚠️ Error during cleanup:', cleanupError);
          // If cleanup fails, at least inform the user
          toast.error('Registration failed and cleanup encountered issues. Please try again or contact support if the problem persists.');
        }
      }
      
      // Re-throw the original error with more context
      const errorMessage = getRegistrationErrorMessage(error);
      throw new Error(errorMessage);
    }
  }

  // Helper function to provide user-friendly error messages
  function getRegistrationErrorMessage(error) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please use a different email or try logging in.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      case 'permission-denied':
        return 'Permission denied when creating user profile. Please try again.';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again in a moment.';
      default:
        // Return the original error message for unexpected errors
        return error.message || 'Registration failed. Please try again.';
    }
  }

  async function checkEmailVerification() {
    if (currentUser) {
      // Force refresh the token to get updated emailVerified status
      await currentUser.reload();
      return currentUser.emailVerified;
    }
    return false;
  }

  async function resendVerificationEmail() {
    if (currentUser && !currentUser.emailVerified) {
      return sendEmailVerification(currentUser, {
        url: getContinueUrl()
      });
    }
    throw new Error("No user to verify or user already verified");
  }

  async function login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log('✅ Login successful, loading profile...');
      
      // After successful login, immediately load user profile
      const profile = await fetchUserProfile(userCredential.user.uid);

      // Explicitly set the userProfile state to ensure it's updated
      setUserProfile(profile);

      // Check for nearby emergencies (non-blocking)
      if (profile.isDroneOperator && profile.location) {
        notifyOperatorOfNearbyEmergencies(
          userCredential.user.uid,
          profile.location
        )
          .then((result) => {
            console.log(`🔔 Notified user of ${result.count} nearby emergencies`);
          })
          .catch((error) => {
            console.error("⚠️ Error notifying about nearby emergencies:", error);
          });
      }

      console.log('🎉 Login process completed');
      return userCredential;
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Provide user-friendly error messages
      let errorMessage;
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  async function updateUserProfile(userId, data) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      lastActive: new Date().toISOString(),
    });

    // Update local profile
    setUserProfile((prev) => ({
      ...prev,
      ...data,
    }));
  }

  async function fetchUserProfile(userId) {
    try {
      console.log("📖 Fetching user profile for ID:", userId);
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log("✅ User profile data retrieved:", userData);

        // If the user has an emergencyId but no assignment, we should verify
        if (userData.emergencyId && userData.currentAssignmentId) {
          try {
            // Check if the assignment still exists and is active
            const assignmentRef = doc(
              db,
              "searchAssignments",
              userData.currentAssignmentId
            );
            const assignmentSnap = await getDoc(assignmentRef);

            if (
              !assignmentSnap.exists() ||
              assignmentSnap.data().status !== "active"
            ) {
              // Assignment doesn't exist or is not active anymore, clear the fields
              console.log("🧹 Clearing stale emergency assignment data");
              await updateDoc(userRef, {
                emergencyId: deleteField(),
                currentAssignmentId: deleteField(),
              });

              // Update the user data before returning
              userData.emergencyId = null;
              userData.currentAssignmentId = null;
            }
          } catch (verifyError) {
            console.error("⚠️ Error verifying assignment:", verifyError);
            // Don't block the profile fetch if this check fails
          }
        }

        setUserProfile(userData);
        return userData;
      } else {
        console.log("📝 No user profile found, creating a default one");
        // Create a default profile if none exists
        const defaultProfile = {
          displayName: currentUser?.displayName || "",
          email: currentUser?.email || "",
          isDroneOperator: false,
          location: null,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          emergencyId: null,
          currentAssignmentId: null,
        };

        // Save the default profile to Firestore
        await setDoc(userRef, defaultProfile);

        // Set the profile in the state
        setUserProfile(defaultProfile);
        return defaultProfile;
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error);
      // Set a default profile even on error to prevent endless loading
      const fallbackProfile = {
        displayName: currentUser?.displayName || "",
        email: currentUser?.email || "",
        isDroneOperator: false,
        location: null,
        createdAtCreatedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        emergencyId: null,
        currentAssignmentId: null,
        error: true,
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔄 Auth state changed, user:", user?.uid);
      setCurrentUser(user);

      if (user) {
        try {
          // Force synchronous loading of user profile
          const profile = await fetchUserProfile(user.uid);
          console.log("✅ User profile loaded:", profile);

          // Explicitly set the userProfile state to ensure it's updated
          setUserProfile(profile);
        } catch (error) {
          console.error("❌ Error loading user profile:", error);
          setUserProfile(null);
        }
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
    fetchUserProfile,
    checkEmailVerification, 
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}