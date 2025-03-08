import React from "react";
import { CrawlForm } from "@/components/CrawlForm";
import { Badge } from "@/components/ui/badge";
import CountrySelector, { COUNTRIES } from "@/components/CountrySelector";
import LocationSelector from "@/components/LocationSelector";
import { Sparkles } from "lucide-react";

// Set window.COUNTRIES for global access to the countries data
if (typeof window !== 'undefined') {
  window.COUNTRIES = COUNTRIES;
}

export default function Index() {
  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24">
      <div className="flex justify-between items-center py-4 mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-2xl">Price Glass</h1>
          <Badge variant="outline" className="gap-1 text-xs py-0">
            <Sparkles className="w-3 h-3" /> AI-Powered
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <LocationSelector />
          <CountrySelector />
        </div>
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
