
interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
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

  static async searchByUrl(url: string): Promise<any> {
    try {
      // Determine store from URL
      const store = Object.keys(this.API_KEYS).find(key => 
        url.toLowerCase().includes(key.toLowerCase())
      );

      if (!store) {
        return { success: false, error: "Unsupported store URL" };
      }

      const apiKey = this.getApiKey(store as keyof typeof FirecrawlService.API_KEYS);
      if (!apiKey) {
        return { success: false, error: `API key not found for ${store}` };
      }

      // TODO: Implement actual API calls
      // For now, returning simulated data
      return this.simulateStoreResponse(url, true);
    } catch (error) {
      console.error("Error during URL search:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search by URL"
      };
    }
  }

  static async searchByProduct(productName: string): Promise<any> {
    try {
      // Check if we have API keys for any stores
      const availableStores = Object.keys(this.API_KEYS).filter(store => 
        this.getApiKey(store as keyof typeof FirecrawlService.API_KEYS)
      );

      if (availableStores.length === 0) {
        return { success: false, error: "No store API keys configured" };
      }

      // TODO: Implement parallel API calls to all stores
      // For now, returning simulated data
      return this.simulateStoreResponse(productName, false);
    } catch (error) {
      console.error("Error during product search:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search by product name"
      };
    }
  }

  static async crawlWebsite(searchTerm: string): Promise<{ success: boolean; error?: string; data?: any }> {
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

  private static simulateStoreResponse(searchTerm: string, isUrl: boolean): { success: boolean; data: any } {
    // Simulation response for testing
    return {
      success: true,
      data: {
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
      }
    };
  }
}
