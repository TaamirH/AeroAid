// Create a new file: src/components/weather/WeatherWidget.js
import React, { useState, useEffect } from 'react';

const WeatherWidget = ({ latitude, longitude }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!latitude || !longitude) {
        setLoading(false);
        setError('No location provided');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=eba7079cc24d4065f66efb228602b76d`
        );
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Weather data:', data);
        setWeather(data);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="text-md font-semibold mb-2">Weather Conditions</h3>
        <p className="text-sm">Loading weather data...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-blue-50 p-4 rounded mb-4">
        <h3 className="text-md font-semibold mb-2">Weather Conditions</h3>
        <p className="text-sm text-red-500">
          {error || 'Weather data unavailable'}
        </p>
      </div>
    );
  }

  // Only render weather details if we have all required properties
  const hasTemp = weather.main && typeof weather.main.temp !== 'undefined';
  const hasHumidity = weather.main && typeof weather.main.humidity !== 'undefined';
  const hasWind = weather.wind && typeof weather.wind.speed !== 'undefined';
  const hasCondition = weather.weather && weather.weather[0] && weather.weather[0].description;

  return (
    <div className="bg-blue-50 p-4 rounded mb-4">
      <h3 className="text-md font-semibold mb-2">Weather Conditions</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          {hasTemp && (
            <p className="text-sm"><strong>Temperature:</strong> {weather.main.temp}°C</p>
          )}
          {hasHumidity && (
            <p className="text-sm"><strong>Humidity:</strong> {weather.main.humidity}%</p>
          )}
        </div>
        <div>
          {hasWind && (
            <p className="text-sm"><strong>Wind:</strong> {weather.wind.speed} m/s</p>
          )}
          {hasCondition && (
            <p className="text-sm"><strong>Conditions:</strong> {weather.weather[0].description}</p>
          )}
        </div>
      </div>
      {hasWind && weather.wind.speed > 10 && (
        <p className="text-sm text-red-600 mt-2">
          Warning: High winds may affect drone operation
        </p>
      )}
    </div>
  );
};

export default WeatherWidget;