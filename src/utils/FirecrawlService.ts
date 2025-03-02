
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

interface ChatResponse {
  success: boolean;
  message: string;
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

// Cache implementation
class CacheManager {
  private static cache: Map<string, {data: any, timestamp: number}> = new Map();
  private static CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

  static set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get(key: string): any | null {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) return null;
    
    // Check if cache is expired
    if (Date.now() - cachedItem.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.data;
  }

  static clear(): void {
    this.cache.clear();
  }
}

export class FirecrawlService {
  static async lookupProductWithGemini(query: string): Promise<any> {
    // Check cache first
    const cacheKey = `gemini_${query}`;
    const cachedData = CacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log("Using cached data for Gemini lookup:", query);
      return cachedData;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { query, type: 'name' }
      });

      if (error) throw error;
      
      const result = {
        success: true,
        product: data
      };
      
      // Cache the result
      CacheManager.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        success: false,
        error: 'Failed to process product query'
      };
    }
  }

  private static async lookupBarcode(barcode: string): Promise<any> {
    // Check cache first
    const cacheKey = `barcode_${barcode}`;
    const cachedData = CacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log("Using cached barcode data:", barcode);
      return cachedData;
    }
    
    try {
      // Call our Edge Function with barcode
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { query: barcode, type: 'barcode' }
      });

      if (error) throw error;
      
      const result = {
        success: true,
        product: data
      };
      
      // Cache the result
      CacheManager.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return {
        success: false,
        error: 'Failed to lookup barcode'
      };
    }
  }

  static async askGeminiAI(message: string): Promise<ChatResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { query: message, type: 'chat' }
      });

      if (error) throw error;

      return {
        success: true,
        message: data.message || "I couldn't find a specific answer to your question."
      };
    } catch (error) {
      console.error("Error asking Gemini AI:", error);
      return {
        success: false,
        message: "Sorry, I encountered an error processing your request."
      };
    }
  }

  static async crawlWebsite(searchTerm: string): Promise<CrawlResponse> {
    // Check cache first
    const cacheKey = `crawl_${searchTerm}`;
    const cachedData = CacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log("Using cached crawl data:", searchTerm);
      return cachedData;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: {
          query: searchTerm,
          type: searchTerm.startsWith('http') ? 'url' : /^\d+$/.test(searchTerm) ? 'barcode' : 'name'
        }
      });

      if (error) throw error;
      
      // Cache the result
      CacheManager.set(cacheKey, data);
      
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
