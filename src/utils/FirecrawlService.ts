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

  private static async lookupBarcode(barcode: string): Promise<any> {
    try {
      // Example using UPCItemDB API
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      const data = await response.json();
      
      if (data.code === 'OK' && data.items?.length > 0) {
        return {
          success: true,
          product: data.items[0]
        };
      }
      
      return {
        success: false,
        error: 'Product not found'
      };
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return {
        success: false,
        error: 'Failed to lookup barcode'
      };
    }
  }

  private static async scrapeProductDetails(url: string): Promise<any> {
    try {
      // Here we would integrate with a web scraping service or API
      // For now, we'll make a simple fetch to get page metadata
      const response = await fetch(url);
      const html = await response.text();
      
      // Basic metadata extraction (would be more sophisticated in production)
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '';
      
      return {
        success: true,
        product: {
          name: title,
          url: url
        }
      };
    } catch (error) {
      console.error('URL scraping error:', error);
      return {
        success: false,
        error: 'Failed to extract product details'
      };
    }
  }

  static async searchByUrl(url: string): Promise<CrawlResponse> {
    try {
      // First, scrape the product details from the URL
      const scrapeResult = await this.scrapeProductDetails(url);
      
      if (!scrapeResult.success) {
        return {
          success: false,
          error: scrapeResult.error
        };
      }

      // Insert the product into our database
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: scrapeResult.product.name,
          url: url
        }])
        .select()
        .single();

      if (productError) {
        console.error("Error saving product:", productError);
        return { success: false, error: "Failed to save product" };
      }

      // Now search for prices across different stores
      const priceData = await this.searchPricesAcrossStores(scrapeResult.product.name);
      
      if (!priceData.success) {
        return priceData;
      }

      // Save the price records
      const priceRecords = priceData.data.map(item => ({
        product_id: product.id,
        store_name: item.store,
        price: parseFloat(item.price.replace('₹', '')),
        url: item.url || null,
        regular_price: item.regular_price,
        discount_percentage: item.discount_percentage,
        vendor_rating: item.vendor_rating,
        available: item.available,
        availability_count: item.availability_count,
        offers: item.offers || []
      }));

      const { error: priceError } = await supabase
        .from('price_records')
        .insert(priceRecords);

      if (priceError) {
        console.error("Error saving price records:", priceError);
      }

      return {
        success: true,
        status: "completed",
        completed: priceData.data.length,
        total: priceData.data.length,
        creditsUsed: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: priceData.data
      };
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
      // First search for prices across different stores
      const priceData = await this.searchPricesAcrossStores(productName);
      
      if (!priceData.success) {
        return priceData;
      }

      // Save the product to our database
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert([{
          name: productName
        }])
        .select()
        .single();

      if (productError) {
        console.error("Error saving product:", productError);
        return { success: false, error: "Failed to save product" };
      }

      // Save the price records
      const priceRecords = priceData.data.map(item => ({
        product_id: product.id,
        store_name: item.store,
        price: parseFloat(item.price.replace('₹', '')),
        url: item.url || null,
        regular_price: item.regular_price,
        discount_percentage: item.discount_percentage,
        vendor_rating: item.vendor_rating,
        available: item.available,
        availability_count: item.availability_count,
        offers: item.offers || []
      }));

      const { error: priceError } = await supabase
        .from('price_records')
        .insert(priceRecords);

      if (priceError) {
        console.error("Error saving price records:", priceError);
      }

      return {
        success: true,
        status: "completed",
        completed: priceData.data.length,
        total: priceData.data.length,
        creditsUsed: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: priceData.data
      };
    } catch (error) {
      console.error("Error during product search:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search by product name"
      };
    }
  }

  private static async searchPricesAcrossStores(productName: string): Promise<CrawlResponse> {
    try {
      // Here we would integrate with various store APIs or web scraping services
      // For demonstration, we'll return simulated data
      // In production, this would make real API calls to various stores
      
      // Example store API call structure:
      // const amazonPrice = await this.fetchAmazonPrice(productName);
      // const flipkartPrice = await this.fetchFlipkartPrice(productName);
      // etc.

      const prices: StorePrice[] = [
        {
          store: "Amazon",
          price: "₹999",
          url: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`,
          regular_price: 1099,
          discount_percentage: 9.1,
          vendor_rating: 4.8,
          available: true,
          availability_count: 100,
          offers: [{ type: "bank_offer", value: "10% off with HDFC cards" }]
        },
        // ... add more stores
      ];

      return {
        success: true,
        status: "completed",
        completed: prices.length,
        total: prices.length,
        creditsUsed: 1,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: prices
      };
    } catch (error) {
      console.error("Error searching prices:", error);
      return {
        success: false,
        error: "Failed to fetch prices from stores"
      };
    }
  }

  static async crawlWebsite(searchTerm: string): Promise<CrawlResponse> {
    const isUrl = searchTerm.startsWith('http');
    
    try {
      // If it's a barcode (numeric string), do a barcode lookup
      if (/^\d+$/.test(searchTerm)) {
        const barcodeResult = await this.lookupBarcode(searchTerm);
        if (barcodeResult.success) {
          return this.searchByProduct(barcodeResult.product.title);
        } else {
          return {
            success: false,
            error: barcodeResult.error
          };
        }
      }

      // Otherwise, proceed with URL or product name search
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
}
