
import { supabase } from "@/integrations/supabase/client";

interface ErrorResponse {
  success: false;
  error: string;
}

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

interface ProductInfo {
  name?: string;
  price?: string;
  brand?: string;
  category?: string;
  url?: string;
  regular_price?: number;
  discount_percentage?: number;
  vendor_rating?: number;
  available?: boolean;
  availability_count?: number;
  offers?: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  static async lookupProductWithGemini(query: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { query, type: 'name' }
      });

      if (error) throw error;

      return {
        success: true,
        product: data
      };
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        success: false,
        error: 'Failed to process product query'
      };
    }
  }

  private static async lookupBarcode(barcode: string): Promise<any> {
    try {
      // Call our Edge Function with barcode
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { query: barcode, type: 'barcode' }
      });

      if (error) throw error;

      return {
        success: true,
        product: data
      };
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return {
        success: false,
        error: 'Failed to lookup barcode'
      };
    }
  }

  static async crawlWebsite(searchTerm: string): Promise<CrawlResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: {
          query: searchTerm,
          type: searchTerm.startsWith('http') ? 'url' : /^\d+$/.test(searchTerm) ? 'barcode' : 'name'
        }
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error during crawl:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch prices"
      };
    }
  }
}
