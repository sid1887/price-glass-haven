
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
  history: string[];
  onSelectItem: (item: string) => void;
  onClearHistory: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectItem, onClearHistory }) => {
  const [open, setOpen] = useState(false);
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Recent Searches</h3>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearHistory}>
            Clear All
          </Button>
        )}
      </div>
      
      {history.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-muted-foreground border rounded-md p-4">
          No recent searches
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div
              key={index}
              onClick={() => onSelectItem(item)}
              className="flex p-3 rounded-md hover:bg-accent cursor-pointer relative group border"
            >
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span>{item}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
