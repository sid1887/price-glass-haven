
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { Sparkles } from "lucide-react";

interface ProductSummaryProps {
  description: string;
}

const ProductSummary: React.FC<ProductSummaryProps> = ({ description }) => {
  const [summary, setSummary] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!description) return;

    const getSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await FirecrawlService.summarizeProductDescription(description);
        if (result.success) {
          setSummary(result.summary);
        } else {
          setError("Failed to generate summary");
        }
      } catch (err) {
        setError("An error occurred while generating the summary");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getSummary();
  }, [description]);

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
          <div className="text-sm text-red-500">{error}</div>
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
