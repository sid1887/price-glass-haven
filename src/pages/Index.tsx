
import React, { useState, useEffect } from "react";
import { CrawlForm } from "@/components/CrawlForm";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";
import LocationSelector from "@/components/LocationSelector";
import { Country } from "@/components/CountrySelector";

export default function Index() {
  const { toast } = useToast();
  const [keySet, setKeySet] = useState(true); // Default to true since Crawl4AI doesn't require an API key
  const [selectedLocation, setSelectedLocation] = useState<{
    country: Country,
    city?: string
  } | null>(null);
  
  useEffect(() => {
    // Set a default API key since Crawl4AI doesn't actually require one
    FirecrawlService.setApiKey("free-access");
    setKeySet(true);
    
    toast({
      title: "Using Crawl4AI",
      description: "This app is powered by the free and open source Crawl4AI service",
    });
  }, [toast]);

  const handleLocationChange = (location: { country: Country, city?: string }) => {
    setSelectedLocation(location);
    // Additional logic can be added here if needed when location changes
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-center py-4 mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-2xl">Price Glass</h1>
          <Badge variant="outline" className="gap-1 text-xs py-0">
            <Sparkles className="w-3 h-3" /> AI-Powered
          </Badge>
        </div>
        <LocationSelector onLocationChange={handleLocationChange} />
      </div>
      
      <div className="space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Find the Best Deals with AI
          </h2>
          <p className="text-muted-foreground">
            Compare prices across multiple stores with our AI-powered search
          </p>
        </div>
        
        <CrawlForm />
      </div>
    </div>
  );
}
