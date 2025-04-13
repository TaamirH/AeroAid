// File: src/components/location/AddressAutocomplete.js
import React, { useState, useEffect, useRef } from 'react';

const AddressAutocomplete = ({ onLocationSelect, initialValue = '' }) => {
  const [address, setAddress] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [structuredAddress, setStructuredAddress] = useState({
    country: '',
    city: '',
    street: ''
  });
  const timeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update address when structured parts change
  useEffect(() => {
    const parts = [];
    if (structuredAddress.street) parts.push(structuredAddress.street);
    if (structuredAddress.city) parts.push(structuredAddress.city);
    if (structuredAddress.country) parts.push(structuredAddress.country);
    
    if (parts.length > 0) {
      setAddress(parts.join(', '));
    }
  }, [structuredAddress]);

  // Fetch suggestions when the address changes
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (address.trim().length > 2 && focused) {
      setLoading(true);
      timeoutRef.current = setTimeout(() => {
        fetchSuggestions(address);
      }, 500); // Debounce to prevent too many API calls
    } else {
      setSuggestions([]);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [address, focused]);

  const fetchSuggestions = async (query) => {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSelectedLocation({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    });
    
    setAddress(suggestion.display_name);
    
    // Try to extract structured address parts
    const addr = suggestion.address || {};
    setStructuredAddress({
      country: addr.country || '',
      city: addr.city || addr.town || addr.village || addr.suburb || '',
      street: [addr.road, addr.house_number].filter(Boolean).join(' ') || ''
    });
    
    setSuggestions([]);
    
    // Pass the location data to the parent component
    onLocationSelect({
      location: {
        latitude: parseFloat(suggestion.lat),
        longitude: parseFloat(suggestion.lon)
      },
      address: suggestion.display_name,
      structuredAddress: {
        country: addr.country || '',
        city: addr.city || addr.town || addr.village || addr.suburb || '',
        street: [addr.road, addr.house_number].filter(Boolean).join(' ') || ''
      }
    });
  };

  const handleInputChange = (e) => {
    setAddress(e.target.value);
  };

  const handleStructuredInputChange = (e) => {
    const { name, value } = e.target;
    setStructuredAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <div>
          <label className="block text-gray-700 text-sm mb-1">Country</label>
          <input
            type="text"
            name="country"
            value={structuredAddress.country}
            onChange={handleStructuredInputChange}
            placeholder="Country"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onFocus={() => setFocused(true)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm mb-1">City</label>
          <input
            type="text"
            name="city"
            value={structuredAddress.city}
            onChange={handleStructuredInputChange}
            placeholder="City"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onFocus={() => setFocused(true)}
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm mb-1">Street</label>
          <input
            type="text"
            name="street"
            value={structuredAddress.street}
            onChange={handleStructuredInputChange}
            placeholder="Street"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            onFocus={() => setFocused(true)}
          />
        </div>
      </div>
      
      <div className="relative mb-3">
        <label className="block text-gray-700 text-sm mb-1">Full Address or Search Term</label>
        <input
          type="text"
          value={address}
          onChange={handleInputChange}
          placeholder="Search for an address..."
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        
        {loading && (
          <div className="absolute right-3 top-9">
            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {suggestions.length > 0 && (
          <div 
            ref={suggestionsRef} 
            className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
          >
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                className="cursor-pointer hover:bg-gray-100 p-2"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <p className="font-medium">{suggestion.display_name}</p>
                <p className="text-xs text-gray-500">
                  Lat: {suggestion.lat}, Lon: {suggestion.lon}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedLocation && (
        <div className="bg-gray-100 p-3 rounded mb-3">
          <p className="font-semibold">Selected Coordinates:</p>
          <p>Lat: {selectedLocation.latitude.toFixed(6)}</p>
          <p>Lng: {selectedLocation.longitude.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;