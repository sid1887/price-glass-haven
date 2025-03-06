
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, X, ExternalLink, Star, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

export interface HistoryItem {
  id: string;
  timestamp: number;
  query: string;
  type: 'url' | 'name' | 'barcode';
  bestPrice?: {
    store: string;
    price: string;
    url?: string;
  };
}

interface HistoryListProps {
  onSelectItem?: (item: HistoryItem) => void;
}

export const HistoryList = ({ onSelectItem }: HistoryListProps) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem('price_comparison_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        // Sort by most recent first
        const sortedHistory = parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistoryItems(sortedHistory);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem('price_comparison_history');
    setHistoryItems([]);
  };

  const removeHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updatedHistory = historyItems.filter(item => item.id !== id);
      localStorage.setItem('price_comparison_history', JSON.stringify(updatedHistory));
      setHistoryItems(updatedHistory);
    } catch (error) {
      console.error("Error removing history item:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatQuery = (query: string, type: string) => {
    if (type === 'url') {
      try {
        const url = new URL(query);
        return url.hostname + url.pathname.slice(0, 20) + (url.pathname.length > 20 ? '...' : '');
      } catch {
        return query.slice(0, 30) + (query.length > 30 ? '...' : '');
      }
    }
    return query.slice(0, 30) + (query.length > 30 ? '...' : '');
  };

  return (
    <div className="history-container mb-4 border rounded-lg p-2 bg-card">
      <div 
        className="flex items-center justify-between cursor-pointer p-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Search History</h3>
          <Badge variant="outline" className="ml-2">
            {historyItems.length}
          </Badge>
        </div>
        <div className="flex gap-2">
          {historyItems.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                clearHistory();
              }}
              className="h-8 px-2"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScrollArea className="max-h-64">
              {historyItems.length > 0 ? (
                <div className="p-2 space-y-2">
                  {historyItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onSelectItem && onSelectItem(item)}
                    >
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between">
                          <CardTitle className="text-sm flex items-center">
                            {formatQuery(item.query, item.type)}
                            <Badge variant="outline" className="ml-2">
                              {item.type === 'url' ? 'URL' : item.type === 'barcode' ? 'Barcode' : 'Product'}
                            </Badge>
                          </CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => removeHistoryItem(item.id, e)} 
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          {formatDate(item.timestamp)}
                        </CardDescription>
                      </CardHeader>
                      {item.bestPrice && (
                        <CardContent className="p-3 pt-2">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{item.bestPrice.store}</span>
                              <span className="text-green-600">{item.bestPrice.price}</span>
                            </div>
                            {item.bestPrice.url && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => {
                                e.stopPropagation();
                                window.open(item.bestPrice?.url, '_blank');
                              }}>
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No search history yet
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
