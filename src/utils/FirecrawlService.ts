
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

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEYS = {
    AMAZON: 'amazon_api_key',
    FLIPKART: 'flipkart_api_key',
    DMART: 'dmart_api_key',
    RELIANCE: 'reliance_api_key'
  };

  static saveApiKey(store: keyof typeof FirecrawlService.API_KEYS, apiKey: string): void {
    localStorage.setItem(store, apiKey);
    console.log(`API key saved for ${store}`);
  }

  static getApiKey(store: keyof typeof FirecrawlService.API_KEYS): string | null {
    return localStorage.getItem(store);
  }

  static async searchByUrl(url: string): Promise<CrawlResponse> {
    try {
      const results = await this.simulateStoreResponse(url, true);
      return results;
    } catch (error) {
      console.error("Error during URL search:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search by URL"
      };
    }
  }

  static async searchByProduct(productName: string): Promise<CrawlResponse> {
    try {
      const results = await this.simulateStoreResponse(productName, false);
      return results;
    } catch (error) {
      console.error("Error during product search:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search by product name"
      };
    }
  }

  static async crawlWebsite(searchTerm: string): Promise<CrawlResponse> {
    const isUrl = searchTerm.startsWith('http');
    
    try {
      const result = isUrl 
        ? await this.searchByUrl(searchTerm)
        : await this.searchByProduct(searchTerm);

      return result;
    } catch (error) {
      console.error("Error during crawl:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect to store APIs"
      };
    }
  }

  private static simulateStoreResponse(searchTerm: string, isUrl: boolean): Promise<CrawlStatusResponse> {
    return Promise.resolve({
      success: true,
      status: "completed",
      completed: 5,
      total: 5,
      creditsUsed: 1,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      data: [
        { 
          store: "D-Mart",
          price: "₹899",
          url: isUrl ? searchTerm : "https://www.dmart.in",
          regular_price: 999,
          discount_percentage: 10,
          vendor_rating: 4.5,
          available: true,
          availability_count: 50,
          offers: [{ type: "cashback", value: "5%" }]
        },
        { 
          store: "Reliance Mart",
          price: "₹949",
          url: "https://www.reliancemart.in",
          regular_price: 999,
          discount_percentage: 5,
          vendor_rating: 4.2,
          available: true,
          availability_count: 25,
          offers: [{ type: "instant_discount", value: "₹50" }]
        },
        { 
          store: "Amazon",
          price: "₹999",
          url: "https://www.amazon.in",
          regular_price: 1099,
          discount_percentage: 9.1,
          vendor_rating: 4.8,
          available: true,
          availability_count: 100,
          offers: [{ type: "bank_offer", value: "10% off with HDFC cards" }]
        },
        { 
          store: "Flipkart",
          price: "₹929",
          url: "https://www.flipkart.com",
          regular_price: 1049,
          discount_percentage: 11.4,
          vendor_rating: 4.6,
          available: true,
          availability_count: 75,
          offers: [{ type: "combo_offer", value: "Buy 2 get 10% off" }]
        },
        { 
          store: "Local Store",
          price: "₹999",
          regular_price: 999,
          discount_percentage: 0,
          vendor_rating: 4.0,
          available: true,
          availability_count: 10,
          offers: []
        }
      ]
    });
  }
}
