
import { supabase } from "@/integrations/supabase/client";

interface ErrorResponse {
  success: false;
  error: string;
}

interface StorePrice {
  store: string;
  price: string;
  url?: string;
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
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { success: false, error: "Please sign in to compare prices" };
      }

      // First, create a product entry
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          { name: url, url: url }
        ])
        .select()
        .single();

      if (productError) {
        console.error("Error creating product:", productError);
        return { success: false, error: "Failed to save product" };
      }

      const results = await this.simulateStoreResponse(url, true);
      
      if (results.success) {
        // Save price records
        const priceRecords = results.data.map(item => ({
          product_id: product.id,
          store_name: item.store,
          price: parseFloat(item.price.replace('₹', '')),
          url: item.url || null
        }));

        const { error: priceError } = await supabase
          .from('price_records')
          .insert(priceRecords);

        if (priceError) {
          console.error("Error saving price records:", priceError);
          return { success: false, error: "Failed to save price comparisons" };
        }
      }

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
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        return { success: false, error: "Please sign in to compare prices" };
      }

      // Create product entry
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([
          { name: productName }
        ])
        .select()
        .single();

      if (productError) {
        console.error("Error creating product:", productError);
        return { success: false, error: "Failed to save product" };
      }

      const results = await this.simulateStoreResponse(productName, false);
      
      if (results.success) {
        // Save price records
        const priceRecords = results.data.map(item => ({
          product_id: product.id,
          store_name: item.store,
          price: parseFloat(item.price.replace('₹', '')),
          url: item.url || null
        }));

        const { error: priceError } = await supabase
          .from('price_records')
          .insert(priceRecords);

        if (priceError) {
          console.error("Error saving price records:", priceError);
          return { success: false, error: "Failed to save price comparisons" };
        }
      }

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

  private static simulateStoreResponse(searchTerm: string, isUrl: boolean): Promise<CrawlResponse> {
    // Simulation response for testing
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
          url: isUrl ? searchTerm : "https://www.dmart.in"
        },
        { 
          store: "Reliance Mart",
          price: "₹949",
          url: "https://www.reliancemart.in"
        },
        { 
          store: "Amazon",
          price: "₹999",
          url: "https://www.amazon.in"
        },
        { 
          store: "Flipkart",
          price: "₹929",
          url: "https://www.flipkart.com"
        },
        { 
          store: "Local Store",
          price: "₹999",
        }
      ]
    });
  }
}
