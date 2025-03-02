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

// Cache implementation with debugging
class CacheManager {
  private static cache: Map<string, {data: any, timestamp: number}> = new Map();
  private static CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache

  static set(key: string, data: any): void {
    console.log(`[Cache] Setting cache for key: ${key}`);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get(key: string): any | null {
    const cachedItem = this.cache.get(key);
    if (!cachedItem) {
      console.log(`[Cache] Cache miss for key: ${key}`);
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cachedItem.timestamp > this.CACHE_DURATION) {
      console.log(`[Cache] Expired cache for key: ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`[Cache] Cache hit for key: ${key}`);
    return cachedItem.data;
  }

  static clear(): void {
    console.log(`[Cache] Clearing all cache entries`);
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
      console.log("Calling Gemini API for product lookup:", query);
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query, 
          type: 'name',
          action: 'smart_extract' // Enhanced prompt for better extraction
        }
      });

      if (error) {
        console.error("Gemini API error:", error);
        throw error;
      }
      
      console.log("Gemini API response:", data);
      
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

  static async lookupBarcode(barcode: string): Promise<any> {
    // Check cache first
    const cacheKey = `barcode_${barcode}`;
    const cachedData = CacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log("Using cached barcode data:", barcode);
      return cachedData;
    }
    
    try {
      // Call our Edge Function with barcode and enhanced AI extraction
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query: barcode, 
          type: 'barcode',
          action: 'improve_barcode' // AI-assisted barcode recognition
        }
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
      console.log("Sending chat request to Gemini AI:", message);
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query: message, 
          type: 'chat',
          context: 'price_comparison_assistant' // Enhanced context for better responses
        }
      });

      if (error) {
        console.error("Error in Gemini chat response:", error);
        throw error;
      }

      console.log("Received Gemini AI response:", data);
      return {
        success: true,
        message: data.message || "I couldn't find a specific answer to your question."
      };
    } catch (error) {
      console.error("Error asking Gemini AI:", error);
      return {
        success: false,
        message: "Sorry, I encountered an error processing your request. Our AI service might be temporarily unavailable."
      };
    }
  }

  static async summarizeProductDescription(description: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query: description, 
          type: 'summarize',
          action: 'product_description'
        }
      });

      if (error) throw error;
      
      return {
        success: true,
        summary: data.summary
      };
    } catch (error) {
      console.error("Error summarizing product description:", error);
      return {
        success: false,
        error: "Failed to summarize product description"
      };
    }
  }

  static async analyzeReviews(reviews: string[]): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          reviews, 
          type: 'analyze',
          action: 'sentiment_analysis'
        }
      });

      if (error) throw error;
      
      return {
        success: true,
        analysis: data.analysis
      };
    } catch (error) {
      console.error("Error analyzing reviews:", error);
      return {
        success: false,
        error: "Failed to analyze reviews"
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
      const inputType = searchTerm.startsWith('http') ? 'url' : /^\d+$/.test(searchTerm) ? 'barcode' : 'name';
      
      console.log(`Starting crawl with input type '${inputType}' for: ${searchTerm}`);
      
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: {
          query: searchTerm,
          type: inputType,
          action: 'enhanced_extraction' // AI-enhanced extraction
        }
      });

      if (error) {
        console.error("Error during crawl:", error);
        throw error;
      }
      
      console.log("Crawl successful:", data);
      
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
