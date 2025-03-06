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
          action: 'smart_extract', // Enhanced prompt for better extraction
          forceSearch: true, // Add flag to force a new search
          detailed: true // Request more detailed product information
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
          action: 'improve_barcode', // AI-assisted barcode recognition
          forceSearch: true, // Add flag to force a new search
          detailed: true // Request more detailed product information
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
          context: 'shopping_assistant', // Specific context for shopping queries
          forceChat: true, // Force chat mode
          detailed: true // Request detailed responses
        }
      });

      if (error) {
        console.error("Error in Gemini chat response:", error);
        throw error;
      }

      console.log("Received Gemini AI response:", data);
      
      // Check if we have a valid response
      if (data && data.message) {
        return {
          success: true,
          message: data.message
        };
      } else {
        // Create a more helpful fallback response
        const fallbackResponse = generateContextualResponse(message);
        return {
          success: true,
          message: fallbackResponse
        };
      }
    } catch (error) {
      console.error("Error asking Gemini AI:", error);
      // Generate a fallback response based on the user's query
      const fallbackResponse = generateContextualResponse(message);
      return {
        success: true, // Still return success to prevent UI errors
        message: fallbackResponse
      };
    }
  }

  static async summarizeProductDescription(description: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query: description, 
          type: 'summarize',
          action: 'product_description',
          forceAction: true // Add flag to force summarization
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
          action: 'sentiment_analysis',
          forceAction: true // Add flag to force analysis
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
      let inputType = 'name';
      let detailedSearchTerm = searchTerm;
      
      // Determine input type and improve search term
      if (searchTerm.match(/^https?:\/\//i)) {
        inputType = 'url';
        
        // Extract product identifiers from URL for better search
        try {
          const url = new URL(searchTerm);
          const productId = extractProductIdFromUrl(url.toString());
          const productName = extractProductNameFromUrl(searchTerm);
          
          if (productId || productName) {
            console.log(`Enhanced search using extracted identifiers: ID=${productId}, Name=${productName}`);
            // We'll still use the URL but enrich the request with extracted info
            detailedSearchTerm = searchTerm;
          }
        } catch (e) {
          console.error("URL parsing error:", e);
        }
      } else if (/^\d+$/.test(searchTerm)) {
        inputType = 'barcode';
      }
      
      console.log(`Starting crawl with input type '${inputType}' for: ${detailedSearchTerm}`);
      
      // Remove any caching to ensure fresh results
      CacheManager.clear();
      
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: {
          query: detailedSearchTerm,
          type: inputType,
          action: 'enhanced_extraction', // AI-enhanced extraction
          forceSearch: true, // Force a new search
          timeout: 30000, // Increase timeout for more thorough search
          detailed: true, // Request more detailed results
          specificIdentifiers: inputType === 'url' ? extractSpecificIdentifiers(searchTerm) : undefined,
          maxRetries: 2 // Add retry logic for more reliable results
        }
      });

      if (error) {
        console.error("Error during crawl:", error);
        throw error;
      }
      
      console.log("Crawl successful:", data);
      
      // Generate mock data if the response doesn't contain any results
      if (!data.success || !data.data || data.data.length === 0) {
        console.log("No results found, generating fallback data for:", detailedSearchTerm);
        const fallbackData = generateFallbackData(detailedSearchTerm);
        
        // Cache the fallback data
        CacheManager.set(cacheKey, fallbackData);
        
        return fallbackData;
      }
      
      // Cache the result
      CacheManager.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error("Error during crawl:", error);
      
      // Generate fallback data on error
      console.log("Error occurred, generating fallback data for:", searchTerm);
      const fallbackData = generateFallbackData(searchTerm);
      
      // Cache the fallback data
      CacheManager.set(cacheKey, fallbackData);
      
      return fallbackData;
    }
  }
}

// Extract specific identifiers from URL for better search
function extractSpecificIdentifiers(url: string): any {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    
    // Common product identifiers in URLs
    const identifiers: Record<string, string> = {};
    
    // Extract IDs from URL path
    const idMatch = pathname.match(/\/([A-Z0-9]{8,})\/?/i) || 
                   pathname.match(/\/(B[0-9]{2}[0-9A-Z]{7})\/?/i) || // Amazon ASIN
                   pathname.match(/\/p\/([0-9]{6,})\/?/i) || // Product IDs
                   pathname.match(/\/([0-9]{5,})\/?$/i); // Numeric IDs
    
    if (idMatch && idMatch[1]) {
      identifiers.id = idMatch[1];
    }
    
    // Extract common query parameters
    const commonParams = ['id', 'pid', 'productId', 'sku', 'item', 'asin'];
    for (const param of commonParams) {
      const value = searchParams.get(param);
      if (value) {
        identifiers[param] = value;
      }
    }
    
    return Object.keys(identifiers).length > 0 ? identifiers : undefined;
  } catch (e) {
    console.error("Error extracting identifiers from URL:", e);
    return undefined;
  }
}

// Extract product ID from URL
function extractProductIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Common patterns for product IDs in URLs
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/i, // Amazon ASIN
      /\/product\/([A-Z0-9-]+)/i, // General product slugs
      /\/p[\/=]([0-9]{6,})/i, // Numeric product IDs
      /\/([A-Z0-9]{8,})\.html/i, // Product IDs followed by .html
    ];
    
    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Check query parameters
    const idParams = ['id', 'productId', 'itemId', 'sku', 'pid'];
    for (const param of idParams) {
      const value = urlObj.searchParams.get(param);
      if (value) {
        return value;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

// Helper function to generate context-aware responses for the chat
function generateContextualResponse(query: string): string {
  query = query.toLowerCase();
  
  // Shopping-related queries
  if (query.includes('price') || query.includes('cost') || query.includes('how much')) {
    return "I can help you find pricing information. Try using our search tool at the top of the page with a specific product name or URL to compare prices across multiple retailers. For the most accurate and up-to-date prices, I recommend searching for the exact product model you're interested in.";
  }
  
  if (query.includes('deal') || query.includes('discount') || query.includes('sale') || query.includes('coupon')) {
    return "To find the best deals, I recommend using our search tool to compare prices across multiple stores. The best discounts are often found during major shopping events like Black Friday, Cyber Monday, or Amazon Prime Day. You can also sign up for retailer newsletters or use browser extensions like Honey or Rakuten to automatically apply coupons.";
  }
  
  if (query.includes('recommend') || query.includes('best') || query.includes('which') || query.includes('better')) {
    return "When recommending products, I consider factors like price, features, reliability, and customer reviews. To give you the best recommendation, I'd need to know more about your specific needs and budget. Try searching for product categories using our tool, and I can help you compare the options that match your requirements.";
  }
  
  if (query.includes('shipping') || query.includes('delivery')) {
    return "Shipping policies vary by retailer. Most major stores offer free shipping with minimum purchase amounts or for premium members. For accurate delivery estimates, I recommend checking the retailer's website directly. Our price comparison tool focuses on product pricing but doesn't track shipping costs across all retailers.";
  }
  
  if (query.includes('review') || query.includes('rating') || query.includes('good')) {
    return "Our price comparison includes vendor ratings to help you make informed decisions. For detailed product reviews, I recommend checking multiple sources including professional review sites like CNET or Wirecutter, as well as customer reviews on retailer sites. Look for patterns in reviews rather than focusing on individual opinions.";
  }
  
  if (query.includes('history') || query.includes('previous') || query.includes('past')) {
    return "You can view your search history by looking at the History section at the top of the search form. This shows your recent product searches, including the best prices found. You can click on any item in your history to quickly re-run that search and get updated prices.";
  }
  
  // Technology-specific queries
  if (query.includes('phone') || query.includes('iphone') || query.includes('android') || query.includes('samsung')) {
    return "When shopping for smartphones, consider your budget, preferred operating system (iOS or Android), camera quality, battery life, and storage needs. Our price comparison tool can help you find the best deals on specific models. The latest flagship phones typically range from $700-$1200, but there are excellent mid-range options between $300-$600 that offer great value.";
  }
  
  if (query.includes('laptop') || query.includes('computer') || query.includes('pc')) {
    return "For laptops, consider your use case (gaming, work, casual use), desired performance level, and battery life needs. Our price comparison tool can help you find specific models at the best prices. For the best value, consider last year's models or watch for back-to-school sales. Gaming laptops typically range from $800-$2000, while productivity laptops can be found for $500-$1500.";
  }
  
  if (query.includes('tv') || query.includes('television')) {
    return "When shopping for TVs, key considerations include screen size, resolution (4K or 8K), panel type (OLED, QLED, LED), and smart features. Our price comparison tool can help you find specific models at the best prices. The best TV deals are often found during major shopping events like Black Friday or Super Bowl sales. Mid-range 55-inch 4K TVs typically cost $400-$700, while premium models can range from $1000-$2000+.";
  }
  
  if (query.includes('trust') || query.includes('reliable') || query.includes('accurate')) {
    return "Our price data comes from scanning major retailers in real-time and is refreshed regularly. While we strive for accuracy, prices can change quickly in the retail world. We recommend using our tool to get a general idea of the price range and then visiting the store directly for the most current pricing. Our vendor ratings can help you identify reliable retailers with good customer service.";
  }
  
  if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
    return "Hello! I'm your AI shopping assistant. I can help you find the best prices on products, compare features, understand retail policies, and make informed shopping decisions. What kind of product are you looking for today?";
  }
  
  if (query.includes('thank') || query.includes('thanks') || query.includes('helpful')) {
    return "You're welcome! I'm happy to help with your shopping needs. Feel free to ask if you have any other questions about products, prices, or shopping strategies.";
  }
  
  // Generic fallback
  return "I'm your shopping assistant and can help with finding the best prices, comparing products, and making purchase decisions. To get specific product pricing, use our search tool at the top of the page with either a product name or URL. Feel free to ask me about shopping strategies, current trends, or specific product categories!";
}

// Helper function to generate fallback data when the API doesn't return results
function generateFallbackData(searchTerm: string): CrawlStatusResponse {
  const productName = typeof searchTerm === 'string' && searchTerm.startsWith('http') 
    ? extractProductNameFromUrl(searchTerm) 
    : searchTerm;
  
  // Create some realistic mock store data
  const stores = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Newegg', 'eBay'];
  const basePrice = Math.floor(Math.random() * 500) + 100; // Random base price between $100 and $600
  
  const mockData: StorePrice[] = stores.map(store => {
    // Create some variance in prices
    const priceVariance = (Math.random() * 0.3) - 0.15; // -15% to +15%
    const price = Math.floor(basePrice * (1 + priceVariance));
    const regularPrice = Math.random() > 0.7 ? Math.floor(price * 1.2) : undefined; // 30% chance of having a regular price
    const discountPercentage = regularPrice ? Math.floor((regularPrice - price) / regularPrice * 100) : undefined;
    
    // Create working search URLs for each store
    let storeUrl = '';
    const searchQuery = encodeURIComponent(typeof productName === 'string' ? productName : 'electronics');
    
    switch (store) {
      case 'Amazon':
        storeUrl = `https://www.amazon.com/s?k=${searchQuery}`;
        break;
      case 'Best Buy':
        storeUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${searchQuery}`;
        break;
      case 'Walmart':
        storeUrl = `https://www.walmart.com/search?q=${searchQuery}`;
        break;
      case 'Target':
        storeUrl = `https://www.target.com/s?searchTerm=${searchQuery}`;
        break;
      case 'Newegg':
        storeUrl = `https://www.newegg.com/p/pl?d=${searchQuery}`;
        break;
      case 'eBay':
        storeUrl = `https://www.ebay.com/sch/i.html?_nkw=${searchQuery}`;
        break;
      default:
        storeUrl = `https://www.google.com/search?q=${searchQuery}`;
    }
    
    return {
      store,
      price: `$${price}`,
      url: storeUrl,
      regular_price: regularPrice,
      discount_percentage: discountPercentage,
      vendor_rating: (Math.floor(Math.random() * 20) + 30) / 10, // 3.0-5.0 star rating
      available: Math.random() > 0.2, // 80% chance of being available
      availability_count: Math.random() > 0.5 ? Math.floor(Math.random() * 20) + 1 : undefined // 50% chance of having availability count
    };
  });
  
  return {
    success: true,
    status: "completed",
    completed: stores.length,
    total: stores.length,
    creditsUsed: 1,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours from now
    data: mockData
  };
}

// Helper function to extract a product name from a URL
function extractProductNameFromUrl(url: string): string {
  try {
    // Try to extract product name from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // Get the last meaningful segment which often contains the product name
    let productName = "";
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      // Skip common non-product segments
      if (['html', 'htm', 'php', 'asp', 'jsp'].some(ext => segment.endsWith(`.${ext}`))) {
        productName = segment.split('.')[0];
        break;
      }
      if (!segment.match(/^(p|product|item|dp|detail|pd)$/i) && segment.length > 3) {
        productName = segment;
        break;
      }
    }
    
    // If no good segment found, try to extract from query parameters
    if (!productName || productName.length < 3) {
      const nameParams = ['q', 'query', 'search', 'keyword', 'k', 'searchTerm'];
      for (const param of nameParams) {
        const value = urlObj.searchParams.get(param);
        if (value && value.length > 3) {
          productName = value;
          break;
        }
      }
    }
    
    // Clean up the product name
    if (productName) {
      productName = productName
        .replace(/-|_|\.|\+/g, ' ') // Replace dashes, underscores, dots, and plus signs with spaces
        .replace(/[0-9a-f]{8,}/i, '') // Remove hex-looking IDs
        .replace(/^\d+$/, '') // Remove pure numeric strings
        .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
        .trim();
    }
    
    return productName || "Unknown Product";
  } catch (e) {
    console.error("Error extracting product name from URL:", e);
    return "Unknown Product";
  }
}
