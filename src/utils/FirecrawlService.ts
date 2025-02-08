
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
      // Simulation for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        data: {
          status: "completed",
          completed: 3,
          total: 3,
          creditsUsed: 1,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          data: [
            { site: "Store A", price: "$99.99" },
            { site: "Store B", price: "$89.99" },
            { site: "Store C", price: "$109.99" }
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
