import React, { useEffect, useRef } from 'react';

// This is a simplified map implementation using Leaflet
// In a production app, you would use a proper map library like Google Maps, Mapbox, or Leaflet
const MapView = ({ center, zoom, markers, searchArea, findings }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  useEffect(() => {
    // Check if leaflet is available
    if (!window.L) {
      // Load leaflet CSS
      const linkElem = document.createElement('link');
      linkElem.rel = 'stylesheet';
      linkElem.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
      document.head.appendChild(linkElem);
      
      // Load leaflet JS
      const scriptElem = document.createElement('script');
      scriptElem.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
      scriptElem.onload = initializeMap;
      document.body.appendChild(scriptElem);
    } else {
      initializeMap();
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Update map when props change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom || 13);
      updateMapElements();
    }
  }, [center, zoom, markers, searchArea, findings]);
  
  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;
    
    // Initialize the map
    mapInstanceRef.current = window.L.map(mapRef.current).setView(
      [center?.lat || 0, center?.lng || 0], 
      zoom || 13
    );
    
    // Add OpenStreetMap tile layer
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);
    
    updateMapElements();
  };
  
  const updateMapElements = () => {
    if (!mapInstanceRef.current || !window.L) return;
    
    // Clear existing markers and layers
    mapInstanceRef.current.eachLayer(layer => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Rectangle) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    
    // Add tile layer if it was removed
    if (mapInstanceRef.current.eachLayer(layer => true).length === 0) {
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);
    }
    
    // Add search area rectangle if provided
    if (searchArea) {
      const bounds = [
        [searchArea.south, searchArea.west],
        [searchArea.north, searchArea.east]
      ];
      
      window.L.rectangle(bounds, {
        color: 'blue',
        weight: 1,
        fillOpacity: 0.1
      }).addTo(mapInstanceRef.current);
    }
    
    // Add markers if provided
    if (markers && markers.length > 0) {
      markers.forEach(marker => {
        if (marker.position) {
          // Create icon based on type
          let icon;
          if (marker.icon === 'red') {
            icon = window.L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            });
          } else if (marker.icon === 'blue') {
            icon = window.L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34]
            });
          }
          
          // Create marker with or without custom icon
          const markerInstance = icon 
            ? window.L.marker([marker.position.lat, marker.position.lng], { icon }) 
            : window.L.marker([marker.position.lat, marker.position.lng]);
          
          // Add popup if title is provided
          if (marker.title) {
            markerInstance.bindPopup(marker.title);
          }
          
          markerInstance.addTo(mapInstanceRef.current);
        }
      });
    }
    
    // Add findings if provided
    if (findings && findings.length > 0) {
      findings.forEach(finding => {
        if (finding.position) {
          // Use a different icon for findings
          const icon = window.L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          const markerInstance = window.L.marker(
            [finding.position.lat, finding.position.lng], 
            { icon }
          );
          
          if (finding.title) {
            markerInstance.bindPopup(finding.title);
          }
          
          markerInstance.addTo(mapInstanceRef.current);
        }
      });
    }
  };
  
  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
  );
};

export default MapView;
