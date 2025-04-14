// File: src/utils/geoUtils.js
// Update this file with improved geolocation handling

// Get current user location with better error handling
export const getCurrentLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support geolocation.'));
    } else {
      // Check if permission is already denied
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          if (result.state === 'denied') {
            reject(new Error('Location access is blocked. Please allow location access in your browser settings.'));
            return;
          }
        });
      }

      // Set default options with reasonable values
      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,         // 10 seconds
        maximumAge: 300000     // 5 minutes
      };
      
      const geolocationOptions = { ...defaultOptions, ...options };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Unknown location error occurred.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please try again or enter location manually.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please check your connection and try again.';
              break;
          }
          
          console.error('Geolocation error:', error.code, error.message);
          reject(new Error(errorMessage));
        },
        geolocationOptions
      );
    }
  });
};
export const getLocationWithFallback = async () => {
  try {
    // First try browser geolocation
    return await getCurrentLocation();
  } catch (error) {
    console.error('Primary location method failed:', error);
    
    // Try IP-based geolocation as fallback
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'ip',
          accuracy: 'low'
        };
      }
      throw new Error('No location data in IP response');
    } catch (fallbackError) {
      console.error('Fallback location method failed:', fallbackError);
      throw error; // Throw the original error
    }
  }
};
// Get address from coordinates using reverse geocoding
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Error getting address:', error);
    return 'Unknown location';
  }
};

// Calculate distance between two points using the Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Convert all values to numbers to ensure proper calculation
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);
  
  // Handle same or very close coordinates (prevent calculation errors)
  if (Math.abs(lat1 - lat2) < 0.00001 && Math.abs(lon1 - lon2) < 0.00001) {
    return 0.01; // Return a small distance instead of zero to ensure visibility
  }
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  
  // Ensure we always return a positive number
  return Math.max(0.01, d);
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

// Convert address to coordinates using geocoding
export const getCoordinatesFromAddress = async (address) => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    throw new Error('No location found for this address');
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    throw error;
  }
};