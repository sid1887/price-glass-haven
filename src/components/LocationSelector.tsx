
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { MapPin, Building, Globe } from "lucide-react";
import { toast } from "sonner";
import { Country, COUNTRIES } from "@/components/CountrySelector";
import { GeoLocationDetector } from "@/components/GeoLocationDetector";
import { getStoredUserLocation } from "@/utils/geo";

interface LocationSelectorProps {
  onLocationChange?: (location: {
    country: Country,
    city?: string
  }) => void;
}

// Sample city database for India
const INDIA_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", 
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Visakhapatnam", "Indore",
  "Thane", "Bhopal", "Patna", "Vadodara", "Ghaziabad"
];

// City database for each country (starting with just India and US)
const CITY_DATABASE: Record<string, string[]> = {
  "IN": INDIA_CITIES,
  "US": [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
    "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
    "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco",
    "Charlotte", "Indianapolis", "Seattle", "Denver", "Washington"
  ]
};

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationChange }) => {
  const [activeTab, setActiveTab] = useState("detect");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    country?: Country,
    city?: string
  } | null>(null);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [searchCity, setSearchCity] = useState("");

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
        
        // Set available cities based on country
        if (CITY_DATABASE[country.code]) {
          setAvailableCities(CITY_DATABASE[country.code]);
        }
      }
    }
  }, []);

  const handleCountryDetected = (country: Country, city?: string) => {
    setUserLocation({ country, city });
    
    // Set available cities based on country
    if (CITY_DATABASE[country.code]) {
      setAvailableCities(CITY_DATABASE[country.code]);
    } else {
      setAvailableCities([]);
    }
    
    if (onLocationChange) {
      onLocationChange({ country, city });
    }
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    
    if (userLocation?.country) {
      setUserLocation({
        ...userLocation,
        city
      });
      
      if (onLocationChange) {
        onLocationChange({ 
          country: userLocation.country, 
          city 
        });
      }
      
      toast.success(`Location set to ${city}, ${userLocation.country.name}`, {
        description: `Showing prices in ${userLocation.country.currency.name} (${userLocation.country.currency.symbol})`,
        duration: 3000,
      });
    }
  };

  const filteredCities = availableCities.filter(city => 
    city.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue="detect" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="detect">Auto-detect</TabsTrigger>
          <TabsTrigger value="city">Select city</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detect" className="mt-4">
          <GeoLocationDetector onDetected={handleCountryDetected} />
        </TabsContent>
        
        <TabsContent value="city" className="mt-4">
          <div className="space-y-4">
            {availableCities.length > 0 ? (
              <Command className="rounded-lg border shadow-md">
                <CommandInput 
                  placeholder="Search city..." 
                  value={searchCity}
                  onValueChange={setSearchCity}
                />
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-60">
                    {filteredCities.map((city) => (
                      <CommandItem
                        key={city}
                        value={city}
                        onSelect={() => handleSelectCity(city)}
                        className="flex items-center gap-2 py-2 cursor-pointer"
                      >
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{city}</span>
                        {selectedCity === city && (
                          <span className="ml-auto text-primary">✓</span>
                        )}
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </Command>
            ) : (
              <div className="text-center p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Please select a country first to see available cities.
                </p>
                {!userLocation?.country && (
                  <Button 
                    variant="outline" 
                    className="mt-2 w-full flex gap-2 justify-center items-center"
                    onClick={() => setActiveTab("detect")}
                  >
                    <Globe className="h-4 w-4" />
                    Auto-detect your location
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {userLocation?.country && (
        <div className="bg-muted/50 p-3 rounded-md mt-4">
          <div className="text-sm font-medium">Current location:</div>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {userLocation.city ? `${userLocation.city}, ` : ''}
              {userLocation.country.name} {userLocation.country.flag}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Prices shown in {userLocation.country.currency.name} ({userLocation.country.currency.symbol})
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
