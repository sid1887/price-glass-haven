
import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Building, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Country, COUNTRIES } from "@/components/CountrySelector";
import { GeoLocationDetector } from "@/components/GeoLocationDetector";
import { getStoredUserLocation, storeUserLocation } from "@/utils/geo";

interface LocationSelectorProps {
  onLocationChange?: (location: {
    country: Country,
    city?: string
  }) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationChange }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("detect");
  const [userLocation, setUserLocation] = useState<{
    country?: Country,
    city?: string
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    const storedLocation = getStoredUserLocation();
    if (storedLocation) {
      const country = COUNTRIES.find(c => c.code === storedLocation.countryCode);
      if (country) {
        setUserLocation({
          country,
          city: storedLocation.city
        });
      }
    }
  }, []);

  const handleCountryDetected = (country: Country, city?: string) => {
    setUserLocation({ country, city });
    
    if (onLocationChange) {
      onLocationChange({ country, city });
    }
    
    setOpen(false);
  };

  const handleManualDetection = async () => {
    setIsDetecting(true);
    try {
      const result = await autoDetectCountry();
      if (result && result.country) {
        handleCountryDetected(result.country, result.city);
        toast.success(`Location detected: ${result.city ? `${result.city}, ` : ''}${result.country.name}`, {
          description: `Prices will now display in ${result.country.currency.name} (${result.country.currency.symbol})`,
          duration: 3000,
        });
      } else {
        toast.error("Could not detect your location", {
          description: "Please try selecting your country manually",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error detecting location:", error);
      toast.error("Failed to detect location", {
        description: "Please ensure location services are enabled",
        duration: 3000,
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Auto-detect country using browser geolocation
  const autoDetectCountry = async (): Promise<{ country: Country, city?: string } | null> => {
    try {
      // Get user coordinates from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Use the coordinates to get the country and city
      const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.address && data.address.country_code) {
        const countryCode = data.address.country_code.toUpperCase();
        const city = data.address.city || data.address.town || data.address.village;
        
        const country = COUNTRIES.find(c => c.code === countryCode);
        if (country) {
          // Store the location data
          storeUserLocation({
            country: country.name,
            countryCode: country.code,
            city: city || undefined,
            latitude,
            longitude
          });
          
          return { country, city };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error in autoDetectCountry:", error);
      return null;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 py-6 px-4 animate-hover transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:border-primary"
        >
          {userLocation?.country ? (
            <>
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {userLocation.city ? `${userLocation.city}, ` : ''}
                {userLocation.country.name}
              </span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>Set your location</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4" align="end">
        <div className="space-y-4">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Your location
          </h3>
          
          <p className="text-sm text-muted-foreground">
            Set your location to get more relevant search results and prices in your local currency.
          </p>
          
          <Tabs defaultValue="detect" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detect">Auto-detect</TabsTrigger>
              <TabsTrigger value="city">Select city</TabsTrigger>
            </TabsList>
            
            <TabsContent value="detect" className="mt-4">
              <div className="space-y-3">
                {!isDetecting ? (
                  <Button 
                    variant="outline" 
                    className="w-full flex gap-2 justify-center items-center py-6"
                    onClick={handleManualDetection}
                  >
                    <MapPin className="h-4 w-4" />
                    Auto-detect my location
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full flex gap-2 justify-center items-center py-6"
                    disabled
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Detecting location...
                  </Button>
                )}
                <GeoLocationDetector onDetected={handleCountryDetected} />
              </div>
            </TabsContent>
            
            <TabsContent value="city" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Coming soon: Select your city manually from our database.
                </p>
                <Button variant="outline" className="w-full flex gap-2 justify-center items-center" disabled>
                  <Building className="h-4 w-4" />
                  Manual city selection
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {userLocation?.country && (
            <div className="bg-muted p-3 rounded-md mt-4">
              <div className="text-sm font-medium">Current location:</div>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>
                  {userLocation.city ? `${userLocation.city}, ` : ''}
                  {userLocation.country.name} ({userLocation.country.flag})
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                All prices will be shown in {userLocation.country.currency.name} ({userLocation.country.currency.symbol})
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LocationSelector;
