
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card } from "@/components/ui/card";

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
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCrawlResult(null);

    try {
      console.log('Starting crawl for URL:', url);
      const result = await FirecrawlService.crawlWebsite(url);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Website crawled successfully",
          duration: 3000,
        });
        setCrawlResult(result);
      } else {
        toast({
          title: "Error",
          description: (result as ErrorResponse).error || "Failed to crawl website",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error crawling website:', error);
      toast({
        title: "Error",
        description: "Failed to crawl website",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full"
          placeholder="Enter product URL to compare"
          required
        />

        {isLoading && <Progress value={progress} className="w-full" />}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full group"
        >
          {isLoading ? "Searching..." : "Compare Prices"}
        </Button>
      </form>

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
