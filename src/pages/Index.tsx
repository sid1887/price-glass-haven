
import React, { useState, useEffect } from "react";
import { CrawlForm } from "@/components/CrawlForm";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Key } from "lucide-react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function Index() {
  const [apiKey, setApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [keySet, setKeySet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key is already stored
    const existingKey = FirecrawlService.getApiKey();
    if (existingKey) {
      setKeySet(true);
    } else {
      setShowApiInput(true);
    }
  }, []);

  const handleSetApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    FirecrawlService.setApiKey(apiKey);
    setKeySet(true);
    setShowApiInput(false);
    
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
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
      </div>
      
      {showApiInput && (
        <Alert className="mb-6">
          <AlertTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Key Required
          </AlertTitle>
          <AlertDescription>
            <p className="mb-4">Please enter your API key to use the price comparison service:</p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSetApiKey}>Save Key</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {keySet && (
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => {
            setShowApiInput(true);
            setKeySet(false);
          }}
        >
          <Key className="h-4 w-4 mr-2" />
          Change API Key
        </Button>
      )}
      
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
