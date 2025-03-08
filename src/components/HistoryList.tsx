
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ExternalLink, X } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export interface HistoryItem {
  id: string;
  timestamp: number;
  query: string;
  type: 'url' | 'name' | 'barcode';
  productName?: string;
  bestPrice?: {
    store: string;
    price: string;
    url?: string;
  }
}

interface HistoryListProps {
  onSelectItem: (item: HistoryItem) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onSelectItem }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  
  // Load history items when popover opens
  const loadHistory = () => {
    try {
      const savedHistory = localStorage.getItem('price_comparison_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory) as HistoryItem[];
        setItems(parsedHistory);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      loadHistory();
    }
    setOpen(isOpen);
  };
  
  const handleClearHistory = () => {
    localStorage.removeItem('price_comparison_history');
    setItems([]);
  };
  
  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    try {
      const updatedItems = items.filter(item => item.id !== id);
      setItems(updatedItems);
      localStorage.setItem('price_comparison_history', JSON.stringify(updatedItems));
    } catch (error) {
      console.error("Error deleting history item:", error);
    }
  };
  
  const getBadgeVariant = (type: string) => {
    switch(type) {
      case 'url': return 'outline';
      case 'name': return 'secondary';
      case 'barcode': return 'default';
      default: return 'outline';
    }
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>Search History</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Recent Searches</h3>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              Clear All
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-muted-foreground">
              No recent searches
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectItem(item);
                    setOpen(false);
                  }}
                  className="flex flex-col p-3 rounded-md hover:bg-accent cursor-pointer relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Badge variant={getBadgeVariant(item.type)}>
                          {item.type === 'url' ? 'URL' : item.type === 'name' ? 'Name' : 'Barcode'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="font-medium line-clamp-1 mt-1">
                        {item.productName || item.query}
                      </div>
                      
                      {item.query.length > 30 && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {item.query}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => handleDeleteItem(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-accent-foreground/10"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  {item.bestPrice && (
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <div className="text-muted-foreground">{item.bestPrice.store}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.bestPrice.price}</span>
                        {item.bestPrice.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.bestPrice?.url, '_blank');
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
