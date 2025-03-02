import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BarcodeScanner } from "./BarcodeScanner";
import { Camera, ExternalLink, Star, ShoppingCart, Sparkles, RefreshCw, ThumbsUp, BadgePercent } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const handleSubmit = async (e: React.FormEvent, searchType: 'url' | 'name' | 'barcode') => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);
    setBestDeal(null);
    setAiStatus("Starting AI-powered search...");

    try {
      const searchTerm = searchType === 'url' ? url : productName;
      console.log(`Starting ${searchType} search for:`, searchTerm);
      
      const statusMessages = [
        "Analyzing search term with Gemini AI...",
        "Searching across multiple stores...",
        "Comparing prices and discounts...",
        "Analyzing vendor ratings...",
        "Finding the best deals for you..."
      ];
      
      let messageIndex = 0;
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          if (newProgress % 20 === 0 && messageIndex < statusMessages.length) {
            setAiStatus(statusMessages[messageIndex]);
            messageIndex++;
          }
          if (newProgress >= 90) clearInterval(progressInterval);
          return newProgress;
        });
      }, 300);
      
      const result = await FirecrawlService.crawlWebsite(searchTerm);
      
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
        
        if (result.data && result.data.length > 0) {
          const sortedData = [...result.data].sort((a, b) => {
            const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || Infinity;
            const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || Infinity;
            return priceA - priceB;
          });
          
          setBestDeal(sortedData[0]);
        }
      } else {
        toast({
          title: "AI Search Error",
          description: (result as ErrorResponse).error || "Failed to search",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error during search:', error);
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

  const handleBarcodeDetected = async (barcode: string) => {
    setShowScanner(false);
    setProductName(barcode);
    toast({
      title: "Barcode Detected",
      description: `Searching for product with barcode: ${barcode}`,
    });
    
    const e = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(e, 'name');
  };

  return (
    <div className="space-y-6">
      {showScanner && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Tabs defaultValue="url" className="w-full">
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
                placeholder="Enter product URL to compare"
                required
              />
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
                placeholder="Enter product name to search"
                required
              />
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

      {crawlResult && crawlResult.success && crawlResult.data && (
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
                    <span className="line-through">{bestDeal.regular_price}</span>
                  </div>
                )}
                {bestDeal.vendor_rating && (
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
                {bestDeal.url && (
                  <Button
                    variant="default"
                    onClick={() => window.open(bestDeal.url, '_blank')}
                    className="w-full mt-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Store
                  </Button>
                )}
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
                            <span className="line-through">{item.regular_price}</span>
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
                      
                      {item.url && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(item.url, '_blank')}
                          className="w-full mt-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visit Store
                        </Button>
                      )}
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
