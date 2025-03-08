
import { toast } from "sonner";
import { Country } from "@/components/CountrySelector";

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  display_name: string;
  address: {
    country: string;
    country_code: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

// Get user's coordinates using browser's geolocation API
export const getUserCoordinates = async (): Promise<Coordinates | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Unable to get your location. Using default location instead.");
        resolve(null);
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0 
      }
    );
  });
};

// Reverse geocode coordinates to get address using OpenStreetMap API
export const reverseGeocode = async (
  coordinates: Coordinates
): Promise<GeocodingResult | null> => {
  try {
    const { latitude, longitude } = coordinates;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "PriceComparisonApp/1.0" // Nominatim requires a user agent
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data as GeocodingResult;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    toast.error("Failed to determine your location");
    return null;
  }
};

// Get nearby hypermarkets based on location (for future expansion)
export const getNearbyHypermarkets = async (city: string, countryCode: string) => {
  // This is a placeholder function that can be expanded later
  // In a real implementation, you would query a database or API for hypermarkets in this location
  
  console.log(`Getting hypermarkets near ${city}, ${countryCode}`);
  
  // Return some dummy data for now
  return [
    { name: "Local Hypermarket 1", distance: "2.3 km" },
    { name: "Local Superstore", distance: "3.5 km" },
    { name: "Regional Mart", distance: "5.1 km" }
  ];
};

// Find the matching country from COUNTRIES array based on country code
export const findCountryByCode = (countryCode: string, countries: Country[]): Country | null => {
  const country = countries.find(
    c => c.code.toLowerCase() === countryCode.toLowerCase()
  );
  return country || null;
};

// Auto-detect country and return the Country object
export const autoDetectCountry = async (countries: Country[]): Promise<Country | null> => {
  try {
    // First try to get coordinates
    const coordinates = await getUserCoordinates();
    if (!coordinates) {
      return null;
    }
    
    // Reverse geocode to get the country
    const geocodeResult = await reverseGeocode(coordinates);
    if (!geocodeResult || !geocodeResult.address.country_code) {
      return null;
    }
    
    // Find the matching country in our list
    const countryCode = geocodeResult.address.country_code.toUpperCase();
    const country = findCountryByCode(countryCode, countries);
    
    if (country) {
      return country;
    }
    
    return null;
  } catch (error) {
    console.error("Error auto-detecting country:", error);
    return null;
  }
};

// Get the name of the city from geocoding result
export const getCityFromGeocode = (geocodeResult: GeocodingResult): string | null => {
  if (!geocodeResult || !geocodeResult.address) {
    return null;
  }
  
  // Try to get the city name from different address properties
  return geocodeResult.address.city || 
         geocodeResult.address.town || 
         geocodeResult.address.village || 
         null;
};

// Store user location data in localStorage
export const storeUserLocation = (data: {
  country: string;
  countryCode: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}) => {
  localStorage.setItem('user_location', JSON.stringify(data));
};

// Get stored user location from localStorage
export const getStoredUserLocation = () => {
  const data = localStorage.getItem('user_location');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
};
