
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
  private static API_KEY_STORAGE_KEY = "firecrawl_api_key";

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log("API key saved");
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: "API key not found" };
    }

    try {
      // Simulation of fetching prices from multiple stores
      // This will be replaced with actual API calls to different stores
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
              url: "https://www.dmart.in"
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
    } catch (error) {
      console.error("Error during crawl:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect to scraping service"
      };
    }
  }
}
