
import { Country, COUNTRIES } from "@/components/CountrySelector";

interface StoredLocation {
  country: string;
  countryCode: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: number;
}

// Store user location in localStorage
export const storeUserLocation = (location: StoredLocation): void => {
  const locationWithTimestamp = {
    ...location,
    timestamp: Date.now()
  };
  localStorage.setItem('user_location', JSON.stringify(locationWithTimestamp));
  
  // Dispatch an event to notify components about the location change
  window.dispatchEvent(new CustomEvent('location-changed', { detail: locationWithTimestamp }));
};

// Get stored user location from localStorage
export const getStoredUserLocation = (): StoredLocation | null => {
  try {
    const locationData = localStorage.getItem('user_location');
    if (!locationData) return null;
    
    return JSON.parse(locationData);
  } catch (error) {
    console.error("Error retrieving stored location:", error);
    return null;
  }
};

// Get user coordinates using browser geolocation API
export const getUserCoordinates = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      resolve(null);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error("Error getting user coordinates:", error);
        resolve(null);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Reverse geocode coordinates to get address
export const reverseGeocode = async (coordinates: { latitude: number; longitude: number }) => {
  try {
    const { latitude, longitude } = coordinates;
    
    // Use Nominatim (OpenStreetMap) for reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch address data");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return null;
  }
};

// Extract city from geocode result
export const getCityFromGeocode = (geocodeResult: any): string | null => {
  if (!geocodeResult || !geocodeResult.address) return null;
  
  // Different providers use different fields for city
  return geocodeResult.address.city || 
         geocodeResult.address.town || 
         geocodeResult.address.village ||
         geocodeResult.address.suburb ||
         null;
};

// Auto-detect country from browser geolocation
export const autoDetectCountry = async (): Promise<{ country: Country, city?: string } | null> => {
  try {
    // First try to get coordinates
    const coordinates = await getUserCoordinates();
    if (!coordinates) return null;
    
    // Use coordinates to get country code
    const geocodeResult = await reverseGeocode(coordinates);
    if (!geocodeResult || !geocodeResult.address || !geocodeResult.address.country_code) {
      return null;
    }
    
    const countryCode = geocodeResult.address.country_code.toUpperCase();
    const country = COUNTRIES.find(c => c.code === countryCode);
    
    if (!country) return null;
    
    // Get city if available
    const city = getCityFromGeocode(geocodeResult);
    
    // Store the location
    storeUserLocation({
      country: country.name,
      countryCode: country.code,
      city: city || undefined,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });
    
    return {
      country,
      city: city || undefined
    };
  } catch (error) {
    console.error("Error in autoDetectCountry:", error);
    return null;
  }
};
