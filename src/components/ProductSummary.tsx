
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Sparkles, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface ProductSummaryProps {
  description: string;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ description }) => {
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const getSummary = React.useCallback(async () => {
    if (!description) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to summarize (try ${retryCount + 1})`, description.substring(0, 100) + "...");
      const result = await FirecrawlService.summarizeProductDescription(description);
      
      if (result.success) {
        setSummary(result.summary);
      } else {
        setError(result.error || "Failed to generate summary");
        console.error("Summarization error:", result.error);
      }
    } catch (err) {
      console.error("Exception during summarization:", err);
      setError("An error occurred while generating the summary");
    } finally {
      setLoading(false);
    }
  }, [description, retryCount]);

  React.useEffect(() => {
    if (!description) return;
    getSummary();
  }, [description, getSummary]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    getSummary();
  };

  if (!description) {
    return null;
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-blue-500" />
          AI-Generated Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500 animate-pulse">Generating summary...</div>
        ) : error ? (
          <div className="space-y-2">
            <div className="text-sm text-red-500 flex items-start">
              <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              className="mt-2 text-xs"
            >
              Try Again
            </Button>
          </div>
        ) : summary ? (
          <div className="text-sm text-gray-700 dark:text-gray-300">{summary}</div>
        ) : (
          <div className="text-sm text-gray-500">No summary available</div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductSummary;
