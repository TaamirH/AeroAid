// src/pages/Profile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { getCurrentLocation } from "../utils/geoUtils";
import { requestNotificationPermission } from "../services/firebase";
import { notifyOperatorOfNearbyEmergencies } from "../services/notificationService";
import AddressAutocomplete from "../components/location/AddressAutocomplete";

const Profile = () => {
  const {
    currentUser,
    userProfile,
    updateUserProfile,
    logout,
    fetchUserProfile,
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    isDroneOperator: false,
    location: null,
  });

  useEffect(() => {
    if (userProfile) {
      console.log("Profile.js: userProfile loaded:", userProfile);

      setFormData({
        displayName: userProfile.displayName || currentUser?.displayName || "",
        isDroneOperator: Boolean(userProfile.isDroneOperator), // Ensure boolean type
        location: userProfile.location || null,
      });
    } else if (currentUser) {
      // Fallback to use current user's displayName if userProfile isn't loaded yet
      console.log(
        "Profile.js: userProfile not loaded, using currentUser:",
        currentUser
      );

      setFormData((prev) => ({
        ...prev,
        displayName: currentUser.displayName || "",
      }));

      // If userProfile isn't loaded yet, try to fetch it again
      const fetchProfile = async () => {
        try {
          if (!userProfile && currentUser) {
            console.log("Profile.js: Fetching user profile manually");
            const profile = await fetchUserProfile(currentUser.uid);
            console.log("Profile.js: Manual profile fetch result:", profile);
          }
        } catch (error) {
          console.error("Error fetching profile manually:", error);
        }
      };

      fetchProfile();
    }
  }, [userProfile, currentUser, fetchUserProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      setFormData((prev) => ({
        ...prev,
        location,
      }));
      toast.success("Location updated successfully!");
      setShowManualLocation(false);
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error(
        error.message ||
          "Failed to get location. Try entering location manually."
      );
      setShowManualLocation(true);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      location: locationData.location,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (formData.isDroneOperator && !formData.location) {
      return toast.error("Drone operators must provide their location!");
    }

    try {
      setLoading(true);

      // Check if user is becoming a drone operator
      const becomingOperator =
        formData.isDroneOperator && !userProfile.isDroneOperator;

      // If becoming a drone operator, request notification permission
      if (becomingOperator) {
        const token = await requestNotificationPermission();
        if (token) {
          await updateUserProfile(currentUser.uid, {
            ...formData,
            notificationToken: token,
          });
        } else {
          await updateUserProfile(currentUser.uid, formData);
          toast.warning(
            "Notifications are disabled. You may miss emergency alerts."
          );
        }

        // Notify the new operator about nearby emergencies if they have a location
        if (formData.location) {
          try {
            const result = await notifyOperatorOfNearbyEmergencies(
              currentUser.uid,
              formData.location
            );
            if (result.success && result.count > 0) {
              toast.info(`You have ${result.count} nearby emergency requests!`);
            }
          } catch (notifyError) {
            console.error(
              "Error notifying about nearby emergencies:",
              notifyError
            );
          }
        }
      } else {
        // Regular profile update
        await updateUserProfile(currentUser.uid, formData);
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out: " + error.message);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Profile
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Update your account information and preferences.
            </p>

            <div className="mt-8 flex flex-col space-y-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to Dashboard
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-5-5H3zm7 5a1 1 0 100 2h1a1 1 0 100-2h-1z"
                    clipRule="evenodd"
                  />
                  <path d="M4 0a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.414l-5-5H4zm7 5V2.586L14.414 6H11z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSave}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="email"
                      value={currentUser.email}
                      className="bg-gray-100 focus:ring-gray-500 focus:border-gray-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md py-2 px-3 cursor-not-allowed"
                      disabled
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      value={formData.displayName}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                      required
                    />
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isDroneOperator"
                      name="isDroneOperator"
                      type="checkbox"
                      checked={formData.isDroneOperator}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="isDroneOperator"
                      className="font-medium text-gray-700"
                    >
                      I am a drone operator
                    </label>
                    <p className="text-gray-500">
                      Register as a drone operator to help respond to
                      emergencies.
                    </p>
                  </div>
                </div>

                {formData.isDroneOperator && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Location Required
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Drone operators need to share their location to
                            receive nearby emergency alerts.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={locationLoading}
                          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                            locationLoading
                              ? "bg-gray-400"
                              : "bg-blue-600 hover:bg-blue-700"
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          {locationLoading ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Updating...
                            </>
                          ) : (
                            "Update My Location"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setShowManualLocation(!showManualLocation)
                          }
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {showManualLocation
                            ? "Hide Manual Input"
                            : "Enter Manually"}
                        </button>
                      </div>

                      {!showManualLocation && formData.location && (
                        <div className="mt-3 bg-white p-3 rounded-md border border-gray-200">
                          <p className="font-semibold text-sm">
                            Current Location:
                          </p>
                          <p className="text-sm">
                            Lat: {formData.location.latitude.toFixed(6)}
                          </p>
                          <p className="text-sm">
                            Lng: {formData.location.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}

                      {showManualLocation && (
                        <div className="mt-3 bg-white p-4 rounded-md border border-gray-200">
                          <h3 className="font-medium mb-2 text-sm">
                            Enter Location Manually
                          </h3>
                          <AddressAutocomplete
                            onLocationSelect={handleLocationSelect}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
