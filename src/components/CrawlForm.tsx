
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BarcodeScanner } from "./BarcodeScanner";
import { 
  Camera, 
  ExternalLink, 
  Star, 
  ShoppingCart, 
  Sparkles, 
  RefreshCw, 
  ThumbsUp, 
  BadgePercent, 
  AlertCircle,
  BarChart,
  Info,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HistoryList, HistoryItem } from "./HistoryList";
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStoredUserLocation } from "@/utils/geo";

interface StorePrice {
  store: string;
  price: string;
  url?: string;
  regular_price?: number;
  discount_percentage?: number;
  vendor_rating?: number;
  available?: boolean;
  availability_count?: number;
  offers?: any[];
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: StorePrice[];
  productInfo?: any;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type CrawlResult = CrawlStatusResponse | ErrorResponse;

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [bestDeal, setBestDeal] = useState<StorePrice | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("");
  const [searchAttempts, setSearchAttempts] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [enhancedRatings, setEnhancedRatings] = useState<{
    min: number;
    max: number;
    avg: number;
    confidence: number;
  } | null>(null);
  const [productInfo, setProductInfo] = useState<{
    name?: string;
    brand?: string;
    model?: string;
    category?: string;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    country?: string;
    city?: string;
  } | null>(null);

  // Load the user's location when component mounts
  useEffect(() => {
    const location = getStoredUserLocation();
    if (location) {
      setUserLocation({
        country: location.country,
        city: location.city
      });
    }
  }, []);

  // Load the most recent search when component mounts
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('price_comparison_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        if (parsedHistory.length > 0) {
          // Sort by most recent first
          const sortedHistory = parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
          const mostRecent = sortedHistory[0];
          
          // Set the appropriate input field based on search type
          if (mostRecent.type === 'url') {
            setUrl(mostRecent.query);
            setActiveTab('url');
          } else {
            setProductName(mostRecent.query);
            setActiveTab(mostRecent.type);
          }
        }
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }, []);

  // Listen for location changes
  useEffect(() => {
    const handleLocationChange = () => {
      const location = getStoredUserLocation();
      if (location) {
        setUserLocation({
          country: location.country,
          city: location.city
        });
      }
    };

    window.addEventListener('country-changed', handleLocationChange);
    
    return () => {
      window.removeEventListener('country-changed', handleLocationChange);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, searchType: 'url' | 'name' | 'barcode') => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    setBestDeal(null);
    setSearchError(null);
    setEnhancedRatings(null);
    setProductInfo(null);
    setAiStatus("Starting AI-powered search...");
    setSearchAttempts(prev => prev + 1);

    try {
      const searchTerm = searchType === 'url' ? url : productName;
      if (!searchTerm.trim()) {
        toast({
          title: "Error",
          description: "Please enter a search term",
          variant: "destructive",
          duration: 3000,
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`Starting ${searchType} search for:`, searchTerm);
      
      // Different status messages based on search type
      const statusMessages = searchType === 'url' 
        ? [
            "Analyzing URL with AI...",
            "Extracting product information...",
            "Searching for best prices across stores...",
            "Comparing prices and discounts...",
            "Finding the best deals for you..."
          ]
        : [
            "Analyzing search term with AI...",
            "Searching across multiple stores...",
            "Comparing prices and discounts...",
            "Analyzing vendor ratings...",
            "Finding the best deals for you..."
          ];
      
      let messageIndex = 0;
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 5, 90);
          if (newProgress % 15 === 0 && messageIndex < statusMessages.length) {
            setAiStatus(statusMessages[messageIndex]);
            messageIndex++;
          }
          if (newProgress >= 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 300);
      
      console.log("Making API call to search for:", searchTerm);
      
      // Get location info for more relevant search
      const locationData = getStoredUserLocation();
      const searchOptions = locationData ? {
        country: locationData.country,
        city: locationData.city
      } : undefined;
      
      const result = await FirecrawlService.crawlWebsite(searchTerm, searchOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      setAiStatus("AI analysis complete!");
      
      if (result.success) {
        toast({
          title: "AI Search Complete",
          description: "Found the best deals for you",
          duration: 3000,
        });
        setCrawlResult(result);
        
        // If we got product info from URL extraction, display a toast
        if (result.productInfo && result.productInfo.name) {
          setProductInfo(result.productInfo);
          
          toast({
            title: "Product Identified",
            description: `Searching for: ${result.productInfo.name}`,
            duration: 3000,
          });
        }
        
        if (result.data && result.data.length > 0) {
          const sortedData = [...result.data].sort((a, b) => {
            const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || Infinity;
            const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || Infinity;
            return priceA - priceB;
          });
          
          setBestDeal(sortedData[0]);

          // Calculate enhanced ratings across similar products
          calculateEnhancedRatings(result.data);
          
          // Save to history
          saveToHistory(searchTerm, searchType, sortedData[0], result.productInfo?.name);
        } else {
          setSearchError("No results found for your search. Try a more specific product name or URL.");
        }
      } else {
        console.error("Search failed:", (result as ErrorResponse).error);
        setSearchError((result as ErrorResponse).error || "Failed to search");
        
        // If it's the first attempt, try one more time
        if (searchAttempts <= 1) {
          toast({
            title: "Retrying search",
            description: "First attempt didn't yield results. Trying again with enhanced parameters...",
            duration: 3000,
          });
          
          // Retry with different parameters - wait a moment before retry
          setTimeout(() => {
            handleSubmit(e, searchType);
          }, 1000);
          return;
        }
        
        toast({
          title: "AI Search Error",
          description: (result as ErrorResponse).error || "Failed to search",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error during search:', error);
      setSearchError("Failed to complete search. Please try again.");
      toast({
        title: "Error",
        description: "Failed to complete search",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const calculateEnhancedRatings = (data: StorePrice[]) => {
    const ratings = data
      .filter(item => item.vendor_rating !== undefined)
      .map(item => Number(item.vendor_rating));
    
    if (ratings.length > 0) {
      const min = Math.min(...ratings);
      const max = Math.max(...ratings);
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      const avg = sum / ratings.length;
      const confidence = Math.min(1, ratings.length / 5) * 100; // Higher confidence with more ratings
      
      setEnhancedRatings({
        min,
        max,
        avg,
        confidence
      });
    }
  };

  const saveToHistory = (query: string, type: 'url' | 'name' | 'barcode', bestPrice?: StorePrice, productDisplayName?: string) => {
    try {
      // Create history item
      const historyItem: HistoryItem = {
        id: uuidv4(),
        timestamp: Date.now(),
        query,
        type,
        productName: productDisplayName,
        bestPrice: bestPrice ? {
          store: bestPrice.store,
          price: bestPrice.price,
          url: bestPrice.url
        } : undefined
      };
      
      // Get existing history
      const savedHistory = localStorage.getItem('price_comparison_history');
      let historyItems: HistoryItem[] = [];
      
      if (savedHistory) {
        historyItems = JSON.parse(savedHistory);
      }
      
      // Add new item (limit to last 50 searches)
      historyItems.unshift(historyItem);
      if (historyItems.length > 50) {
        historyItems = historyItems.slice(0, 50);
      }
      
      // Save back to localStorage
      localStorage.setItem('price_comparison_history', JSON.stringify(historyItems));
      
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    setProductName(barcode);
    toast({
      title: "Barcode Detected",
      description: `Searching for product with barcode: ${barcode}`,
    });
    
    const e = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(e, 'barcode');
  };

  const handleHistoryItemSelect = (item: HistoryItem) => {
    // Set the appropriate input field based on search type
    if (item.type === 'url') {
      setUrl(item.query);
      setActiveTab('url');
    } else {
      setProductName(item.query);
      setActiveTab(item.type);
    }
    
    // Trigger search
    const e = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(e, item.type);
  };

  // Helper function to get store URL or generate a search URL if not available
  const getStoreURL = (store: StorePrice, defaultQuery: string) => {
    // Use the store's URL if it exists and appears valid
    if (store.url && store.url.includes('http') && !store.url.includes('undefined')) {
      return store.url;
    }
    
    // Generate a search URL using the product name or original query
    const searchQuery = productInfo?.name || defaultQuery;
    const storeName = store.store;
    
    // Clean up the query for searching
    const cleanQuery = searchQuery.replace(/[^\w\s]/gi, ' ').trim();
    const query = encodeURIComponent(cleanQuery);
    
    switch(storeName.toLowerCase()) {
      case 'amazon':
        return `https://www.amazon.com/s?k=${query}`;
      case 'flipkart':
        return `https://www.flipkart.com/search?q=${query}`;
      case 'croma':
        return `https://www.croma.com/searchB?q=${query}`;
      case 'reliance digital':
        return `https://www.reliancedigital.in/search?q=${query}`;
      case 'tata cliq':
        return `https://www.tatacliq.com/search/?searchCategory=all&text=${query}`;
      default:
        return `https://www.google.com/search?q=${query}+${storeName}`;
    }
  };

  // Show location badge if available
  const renderLocationBadge = () => {
    if (userLocation && (userLocation.country || userLocation.city)) {
      return (
        <Card className="bg-muted/40 mb-4">
          <CardContent className="p-3">
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-2 text-primary" />
              <span>
                Searching near: 
                <span className="font-medium ml-1">
                  {userLocation.city ? `${userLocation.city}, ` : ''}
                  {userLocation.country || 'Your location'}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      <HistoryList onSelectItem={handleHistoryItemSelect} />

      {userLocation && renderLocationBadge()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url">Search by URL</TabsTrigger>
          <TabsTrigger value="name">Search by Name</TabsTrigger>
          <TabsTrigger value="barcode">Scan Barcode</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url">
          <form onSubmit={(e) => handleSubmit(e, 'url')} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Product URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full"
                placeholder="Enter full product URL (e.g., https://www.amazon.com/product-name)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the complete product URL from Amazon, Flipkart, or other e-commerce sites
              </p>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-primary animate-pulse" />
                    {aiStatus}
                  </span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full group"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary-foreground group-hover:animate-ping" />
              {isLoading ? "AI Searching..." : "Compare Prices with AI"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="name">
          <form onSubmit={(e) => handleSubmit(e, 'name')} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full"
                placeholder="Enter specific product model (e.g., iPhone 13 Pro 128GB)"
                required
              />
              <p className="text-xs text-muted-foreground">
                For best results, include brand, model number, and key specifications
              </p>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-primary animate-pulse" />
                    {aiStatus}
                  </span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full group"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary-foreground group-hover:animate-ping" />
              {isLoading ? "AI Searching..." : "AI-Powered Search"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="barcode">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to open your camera and scan a product barcode. Our AI will help identify the product.
            </p>
            <Button
              onClick={() => setShowScanner(true)}
              className="w-full"
              type="button"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start AI Barcode Scanner
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {searchError && !crawlResult && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
              Search Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{searchError}</p>
            <div className="mt-4 text-sm space-y-1">
              <p className="font-medium">Tips for better results:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Include brand name and model number</li>
                <li>Add specific details like size, color, or capacity</li>
                <li>For URLs, copy the complete product page link</li>
                <li>Try scanning the barcode if available</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {productInfo && !isLoading && !searchError && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Info className="w-4 h-4 mr-2 text-blue-500" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium">{productInfo.name}</span>
              </div>
              {productInfo.brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span>{productInfo.brand}</span>
                </div>
              )}
              {productInfo.model && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <span>{productInfo.model}</span>
                </div>
              )}
              {productInfo.category && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{productInfo.category}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {crawlResult && crawlResult.success && crawlResult.data && crawlResult.data.length > 0 && (
        <div className="space-y-6">
          {bestDeal && (
            <Card className="relative overflow-hidden border-2 border-primary animate-pulse-subtle">
              <div className="absolute top-0 right-0">
                <Badge variant="default" className="m-2 bg-primary/90">
                  Best Deal
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{bestDeal.store}</span>
                  <span className="text-2xl font-bold text-primary">{bestDeal.price}</span>
                </CardTitle>
                {bestDeal.discount_percentage && (
                  <CardDescription className="flex items-center text-green-600">
                    <BadgePercent className="h-4 w-4 mr-1" />
                    Save {bestDeal.discount_percentage}% off regular price
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {bestDeal.regular_price && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Regular Price:</span>
                    <span className="line-through">${bestDeal.regular_price}</span>
                  </div>
                )}
                
                {enhancedRatings && (
                  <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-medium flex items-center mb-2">
                      <BarChart className="h-4 w-4 mr-1 text-blue-500" />
                      Enhanced Ratings Analysis
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted rounded p-2">
                        <div className="text-xs text-muted-foreground">Minimum</div>
                        <div className="flex justify-center items-center mt-1">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="font-medium">{enhancedRatings.min.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="bg-primary/10 rounded p-2">
                        <div className="text-xs text-muted-foreground">Average</div>
                        <div className="flex justify-center items-center mt-1">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="font-medium">{enhancedRatings.avg.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="bg-muted rounded p-2">
                        <div className="text-xs text-muted-foreground">Maximum</div>
                        <div className="flex justify-center items-center mt-1">
                          <Star className="h-3 w-3 text-yellow-500 mr-1" />
                          <span className="font-medium">{enhancedRatings.max.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      Based on ratings from {crawlResult.data.length} stores
                    </div>
                  </div>
                )}
                
                {bestDeal.vendor_rating && !enhancedRatings && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{bestDeal.vendor_rating} Rating</span>
                  </div>
                )}
                
                {bestDeal.available !== undefined && (
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{bestDeal.available ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="default"
                  onClick={() => {
                    const storeURL = getStoreURL(bestDeal, productName || url);
                    window.open(storeURL, '_blank');
                  }}
                  className="w-full mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Store
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>All Price Comparisons</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (productName) {
                      const e = { preventDefault: () => {} } as React.FormEvent;
                      handleSubmit(e, 'name');
                    } else if (url) {
                      const e = { preventDefault: () => {} } as React.FormEvent;
                      handleSubmit(e, 'url');
                    }
                  }}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Found {crawlResult.data.length} stores with this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {crawlResult.data.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{item.store}</div>
                        <div className="text-xl font-bold">{item.price}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {item.regular_price && (
                          <div className="flex items-center gap-1">
                            <span>Regular:</span>
                            <span className="line-through">${item.regular_price}</span>
                          </div>
                        )}
                        {item.discount_percentage && (
                          <div className="flex items-center gap-1 text-green-600">
                            <BadgePercent className="h-3 w-3" />
                            <span>{item.discount_percentage}% off</span>
                          </div>
                        )}
                        {item.vendor_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{item.vendor_rating}</span>
                          </div>
                        )}
                        {item.available !== undefined && (
                          <div className="flex items-center gap-1">
                            {item.available ? (
                              <ThumbsUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <ThumbsUp className="h-3 w-3 text-red-500" />
                            )}
                            <span>{item.available ? 'Available' : 'Unavailable'}</span>
                          </div>
                        )}
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const storeURL = getStoreURL(item, productName || url);
                                window.open(storeURL, '_blank');
                              }}
                              className="w-full mt-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Store
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open product page in a new tab</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
