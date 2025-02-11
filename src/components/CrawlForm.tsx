
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card } from "@/components/ui/card";
import { Search, Store, Settings, Star, Package, BadgePercent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: StorePrice[];
  error?: string;
}

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [apiKeys, setApiKeys] = useState({
    AMAZON: "",
    FLIPKART: "",
    DMART: "",
    RELIANCE: ""
  });

  const handleApiKeySubmit = () => {
    Object.entries(apiKeys).forEach(([store, key]) => {
      if (key) {
        FirecrawlService.saveApiKey(store as keyof typeof apiKeys, key);
      }
    });
    
    toast({
      title: "Success",
      description: "API keys have been saved",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);

    try {
      let searchTerm = url || productName;
      console.log('Searching for:', searchTerm);
      
      const result = await FirecrawlService.crawlWebsite(searchTerm);
      if (result.success) {
        toast({
          title: "Success",
          description: "Price data fetched successfully",
        });
        setCrawlResult(result);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch price data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch price data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  const formatPrice = (price: string | number) => {
    if (typeof price === 'string') return price;
    return `₹${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Price Comparison</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Store API Keys</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Object.entries(apiKeys).map(([store, key]) => (
                <div key={store} className="space-y-2">
                  <label className="text-sm font-medium">{store}</label>
                  <Input
                    type="password"
                    value={key}
                    onChange={(e) => setApiKeys(prev => ({
                      ...prev,
                      [store]: e.target.value
                    }))}
                    placeholder={`Enter ${store} API Key`}
                  />
                </div>
              ))}
              <Button onClick={handleApiKeySubmit} className="w-full">
                Save API Keys
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="product" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="product">Search by Product Name</TabsTrigger>
          <TabsTrigger value="url">Search by URL</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <TabsContent value="product">
            <Input
              type="text"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                setUrl("");
              }}
              className="w-full"
              placeholder="Enter product name (e.g., iPhone 13)"
              required={!url}
            />
          </TabsContent>

          <TabsContent value="url">
            <Input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setProductName("");
              }}
              className="w-full"
              placeholder="Enter product URL to compare"
              required={!productName}
            />
          </TabsContent>

          {isLoading && <Progress value={progress} className="w-full" />}

          <Button
            type="submit"
            disabled={isLoading || (!url && !productName)}
            className="w-full group"
          >
            <Search className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            {isLoading ? "Searching..." : "Compare Prices"}
          </Button>
        </form>
      </Tabs>

      {crawlResult && crawlResult.success && crawlResult.data && (
        <Card className="p-6 animate-fade-in">
          <h3 className="text-xl font-semibold mb-4">Price Comparison Results</h3>
          <div className="space-y-4">
            {crawlResult.data.map((item, index) => (
              <div
                key={index}
                className="flex flex-col space-y-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.store}</h4>
                      <div className="flex items-center space-x-2">
                        {item.vendor_rating && (
                          <div className="flex items-center text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm">{item.vendor_rating}</span>
                          </div>
                        )}
                        {item.availability_count && (
                          <div className="flex items-center text-muted-foreground">
                            <Package className="w-4 h-4" />
                            <span className="ml-1 text-sm">{item.availability_count} in stock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{item.price}</div>
                    {item.regular_price && item.regular_price > parseFloat(item.price.replace('₹', '')) && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatPrice(item.regular_price)}
                      </div>
                    )}
                    {item.discount_percentage && item.discount_percentage > 0 && (
                      <div className="flex items-center text-green-500 text-sm">
                        <BadgePercent className="w-4 h-4 mr-1" />
                        {item.discount_percentage.toFixed(1)}% off
                      </div>
                    )}
                  </div>
                </div>
                
                {item.offers && item.offers.length > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <div className="text-sm font-medium mb-1">Available Offers:</div>
                    <ul className="text-sm text-muted-foreground">
                      {item.offers.map((offer, offerIndex) => (
                        <li key={offerIndex} className="flex items-center">
                          <span className="mr-2">•</span>
                          {offer.type === "bank_offer" ? "💳" : "🏷️"} {offer.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(item.url, '_blank')}
                    className="w-full mt-2"
                  >
                    Visit Store
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
