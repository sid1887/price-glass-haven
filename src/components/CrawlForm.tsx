
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

interface CrawlResult {
  success: boolean;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

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
        <div className="space-y-2">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full transition-all"
            placeholder="Enter product URL"
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

      {crawlResult && (
        <Card className="p-4 animate-fade-in">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="space-y-2 text-sm">
            <p>Status: {crawlResult.status}</p>
            <p>Found Prices: {crawlResult.completed}</p>
            {crawlResult.data && (
              <div className="mt-4">
                <p className="font-semibold mb-2">Price Data:</p>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(crawlResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
