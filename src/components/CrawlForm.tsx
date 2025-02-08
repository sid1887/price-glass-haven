
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card } from "@/components/ui/card";
import { Search, Store } from "lucide-react";

interface StorePrice {
  store: string;
  price: string;
  url?: string;
}

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: StorePrice[];
}

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);

    try {
      const apiKey = FirecrawlService.getApiKey();
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set your API key first",
          variant: "destructive",
        });
        return;
      }

      const result = await FirecrawlService.crawlWebsite(url);
      if (result.success) {
        toast({
          title: "Success",
          description: "Price data fetched successfully",
        });
        setCrawlResult(result.data);
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <Input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full"
            placeholder="Enter product name (e.g., iPhone 13)"
            required
          />
          <Input
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
          <Search className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
          {isLoading ? "Searching..." : "Compare Prices"}
        </Button>
      </form>

      {crawlResult && crawlResult.data && (
        <Card className="p-6 animate-fade-in">
          <h3 className="text-xl font-semibold mb-4">Price Comparison Results</h3>
          <div className="space-y-4">
            {crawlResult.data.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{item.store}</h4>
                    <p className="text-2xl font-bold text-primary">{item.price}</p>
                  </div>
                </div>
                {item.url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(item.url, '_blank')}
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
