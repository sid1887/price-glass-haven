
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Country, COUNTRIES } from "@/components/CountrySelector";
import { autoDetectCountry, getUserCoordinates, reverseGeocode, getCityFromGeocode, storeUserLocation } from "@/utils/geo";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GeoLocationDetectorProps {
  onDetected?: (country: Country, city?: string) => void;
}

export const GeoLocationDetector: React.FC<GeoLocationDetectorProps> = ({ onDetected }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionComplete, setDetectionComplete] = useState(false);

  const detectLocation = async () => {
    setIsDetecting(true);
    setError(null);
    
    try {
      // Get user coordinates
      const coordinates = await getUserCoordinates();
      if (!coordinates) {
        setError("Unable to get your location. Please ensure location services are enabled.");
        setIsDetecting(false);
        return;
      }
      
      // Reverse geocode to get address details
      const geocodeResult = await reverseGeocode(coordinates);
      if (!geocodeResult || !geocodeResult.address.country_code) {
        setError("Could not determine your country. Please select it manually.");
        setIsDetecting(false);
        return;
      }
      
      // Find the matching country in our list
      const countryCode = geocodeResult.address.country_code.toUpperCase();
      const country = COUNTRIES.find(c => c.code === countryCode);
      
      if (country) {
        // Get city name if available
        const cityName = getCityFromGeocode(geocodeResult);
        
        // Store location data
        storeUserLocation({
          country: country.name,
          countryCode: country.code,
          city: cityName || undefined,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        });
        
        // Set country in localStorage
        localStorage.setItem('selectedCountry', country.code);
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('country-changed', { detail: country }));
        
        // Call the callback if provided
        if (onDetected) {
          onDetected(country, cityName || undefined);
        }
        
        toast.success(`Location detected: ${cityName ? `${cityName}, ` : ''}${country.name}`, {
          description: `Prices will now display in ${country.currency.name} (${country.currency.symbol})`,
          duration: 3000,
        });
        
        setDetectionComplete(true);
      } else {
        setError(`Country not supported: ${geocodeResult.address.country}`);
      }
    } catch (error) {
      console.error("Location detection error:", error);
      setError("An error occurred while detecting your location.");
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="space-y-3">
      {!detectionComplete ? (
        <>
          <Button 
            variant="outline" 
            className="w-full flex gap-2 justify-center items-center py-6"
            onClick={detectLocation}
            disabled={isDetecting}
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {isDetecting ? "Detecting location..." : "Auto-detect my location"}
          </Button>
          
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <Button 
          variant="outline" 
          className="w-full flex gap-2 justify-center items-center py-6 bg-green-50"
          onClick={() => setDetectionComplete(false)}
        >
          <Globe className="h-4 w-4" />
          Location detected successfully
        </Button>
      )}
    </div>
  );
};

export default GeoLocationDetector;
