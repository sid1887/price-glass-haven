
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { BarcodeScanner } from "./BarcodeScanner";
import { Camera } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent, searchType: 'url' | 'name' | 'barcode') => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);

    try {
      const searchTerm = searchType === 'url' ? url : productName;
      console.log(`Starting ${searchType} search for:`, searchTerm);
      const result = await FirecrawlService.crawlWebsite(searchTerm);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Search completed successfully",
          duration: 3000,
        });
        setCrawlResult(result);
      } else {
        toast({
          title: "Error",
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

            {isLoading && <Progress value={progress} className="w-full" />}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full group"
            >
              {isLoading ? "Searching..." : "Compare Prices"}
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

            {isLoading && <Progress value={progress} className="w-full" />}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full group"
            >
              {isLoading ? "Searching..." : "Search Products"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="barcode">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to open your camera and scan a product barcode
            </p>
            <Button
              onClick={() => setShowScanner(true)}
              className="w-full"
              type="button"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Barcode Scanner
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {crawlResult && crawlResult.success && crawlResult.data && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Price Comparison Results</h3>
          <div className="space-y-4">
            {crawlResult.data.map((item, index) => (
              <div
                key={index}
                className="flex flex-col space-y-2 p-4 rounded-lg bg-muted/50"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.store}</span>
                  <span className="text-xl font-bold">{item.price}</span>
                </div>
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
