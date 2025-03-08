import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, Code, ShoppingCart, ExternalLink, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductSummary } from "@/components/ProductSummary";
import { HistoryList } from "@/components/HistoryList";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { FirecrawlService } from "@/services/FirecrawlService";
import { cleanProductName } from "@/integrations/supabase/client";
import { getStoredUserLocation } from "@/utils/geo";
import LocationSelector from "@/components/LocationSelector";

interface ProductInfo {
  name: string;
  imageUrl: string;
  prices: {
    store: string;
    price: string;
    originalPrice?: string;
    url: string;
    available: boolean;
  }[];
}

export const CrawlForm = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'url' | 'name' | 'barcode'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'search' | 'results' | 'error'>('search');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load search history from localStorage on component mount
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }
  }, []);

  const addToHistory = (term: string) => {
    const updatedHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 10);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const extractProductInfo = (results: any[], searchTerm: string) => {
    if (!results || results.length === 0) {
      setError('No results found.');
      setCurrentStep('error');
      return;
    }
    
    // Extract the first result
    const firstResult = results[0];
    
    // Clean the product name
    const productName = cleanProductName(firstResult.title || searchTerm);
    
    // Extract prices from all results
    const prices = results.map(result => ({
      store: result.source,
      price: result.price,
      originalPrice: result.originalPrice,
      url: result.url,
      available: result.available,
    }));
    
    // Set the product info
    setProductInfo({
      name: productName,
      imageUrl: firstResult.imageUrl || '/placeholder.png',
      prices: prices,
    });
  };

  const handleBarcodeDetected = (barcode: string) => {
    setSearchTerm(barcode);
    setSearchType('barcode');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setCurrentStep('search');
    setError(null);
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1000);
    
    try {
      // Save search to history
      addToHistory(searchTerm);
      
      // Get location info for more relevant search
      const locationData = getStoredUserLocation();
      
      // Make sure to only pass one parameter to crawlWebsite as that's what it expects
      const result = await FirecrawlService.crawlWebsite(searchTerm);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (result.success) {
        setSearchResults(result.data);
        setCurrentStep('results');
        
        // Extract product info from results
        extractProductInfo(result.data, searchTerm);
      } else {
        setError(result.error || 'Unknown error occurred');
        setCurrentStep('error');
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error during search:', error);
      setError('An error occurred during search. Please try again.');
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Form */}
      <div className="grid gap-4">
        <div className="flex flex-col gap-2">
          <Tabs defaultValue="url" value={searchType} onValueChange={setSearchType} className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="url">Search by URL</TabsTrigger>
              <TabsTrigger value="name">Search by Name</TabsTrigger>
              <TabsTrigger value="barcode">Scan Barcode</TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSearch} className="mt-4">
              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Input 
                    type="url" 
                    placeholder="Enter product URL" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="name" className="space-y-4">
                <div>
                  <Input 
                    type="text" 
                    placeholder="Enter product name" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    For best results, include brand, model number, and key specifications
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="barcode" className="space-y-4">
                <div className="space-y-4">
                  <BarcodeScanner onDetected={handleBarcodeDetected} />
                  <p className="text-xs text-muted-foreground">
                    Position barcode in view of your camera
                  </p>
                </div>
              </TabsContent>
              
              <div className="flex justify-center mt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
                  disabled={isLoading || !searchTerm.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI-Powered Search
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
        
        {/* Location Selector (only show on mobile, hidden by default) */}
        <div className="md:hidden mt-4">
          <LocationSelector 
            onLocationChange={(location) => console.log("Location changed:", location)}
          />
        </div>
      </div>
      
      {/* Progress indicator */}
      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2 w-full bg-muted" />
          <p className="text-sm text-center text-muted-foreground">
            Searching across multiple stores...
          </p>
        </div>
      )}
      
      {/* Search History */}
      {!isLoading && currentStep === 'search' && searchHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(0, 5).map((term, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm(term);
                  setSearchType('name');
                }}
                className="flex items-center gap-1"
              >
                <History className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{term}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Results Display */}
      {currentStep === 'results' && productInfo && (
        <div className="space-y-8 mt-8">
          <ProductSummary 
            product={productInfo}
            onBack={() => setCurrentStep('search')}
          />
          
          {/* Price Comparison Table */}
          {productInfo.prices.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Price Comparison
                </CardTitle>
                <CardDescription>
                  Compare prices across different retailers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden md:table-cell">Available</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productInfo.prices.map((price, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{price.store}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-primary">
                              {price.price}
                            </span>
                            {price.originalPrice && price.originalPrice !== price.price && (
                              <span className="text-sm text-muted-foreground line-through">
                                {price.originalPrice}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {price.available ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                              Out of Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <a href={price.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Visit
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          
          {/* Raw Search Results for Debugging */}
          {searchResults.length > 0 && (
            <Collapsible className="mt-8">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Show Raw Results
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[300px]">
                      <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(searchResults, null, 2)}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
      
      {/* Show history if no search is in progress */}
      {currentStep === 'search' && !isLoading && searchHistory.length > 0 && (
        <div className="mt-8">
          <HistoryList 
            history={searchHistory} 
            onSelectItem={(item) => {
              setSearchTerm(item);
              handleSearch(new Event('submit') as any);
            }}
            onClearHistory={() => {
              setSearchHistory([]);
              localStorage.removeItem('searchHistory');
            }}
          />
        </div>
      )}
    </div>
  );
};
