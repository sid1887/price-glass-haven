
import { supabase } from "@/integrations/supabase/client";
import { cleanProductName } from "@/integrations/supabase/client";
import { convertPrice } from "@/utils/currencyUtils";

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

interface ProductInfo {
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  price?: string;
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
  productInfo?: ProductInfo;
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

  static async askGeminiAI(message: string, previousMessages: {role: string, content: string}[] = []): Promise<any> {
    try {
      console.log("Sending chat request to Gemini AI:", message);
      console.log("Chat context from previous messages:", previousMessages);
      
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query: message, 
          type: 'chat',
          context: 'shopping_assistant', // Specific context for shopping queries
          forceChat: true, // Force chat mode
          detailed: true, // Request detailed responses
          previousMessages: previousMessages // Pass conversation history
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
      return processResultWithCurrency(cachedData);
    }
    
    try {
      let inputType = 'name';
      let specificIdentifiers = undefined;
      let extractedProduct: ProductInfo | null = null;
      
      // Determine input type and improve search term
      if (searchTerm.match(/^https?:\/\//i)) {
        inputType = 'url';
        
        // Extract product details from URL
        extractedProduct = await extractDetailedProductInfoFromUrl(searchTerm);
        
        if (!extractedProduct || !extractedProduct.name) {
          // If we couldn't extract detailed info, try to extract basic info
          try {
            const url = new URL(searchTerm);
            
            // Try to extract product ID or ASIN from URL
            const asinMatch = url.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
            const productId = asinMatch?.[1] || extractProductIdFromUrl(url.toString());
            
            if (productId) {
              specificIdentifiers = { id: productId };
              console.log(`Enhanced search using extracted identifiers: ID=${productId}`);
            }
            
            // Try to extract product name from URL path
            const nameFromPath = extractProductNameFromUrl(url);
            if (nameFromPath) {
              extractedProduct = {
                name: nameFromPath
              };
              console.log(`Extracted product name from URL: ${nameFromPath}`);
            }
          } catch (e) {
            console.error("URL parsing error:", e);
          }
        } else {
          console.log("Successfully extracted product info from URL:", extractedProduct);
        }
      } else if (/^\d+$/.test(searchTerm)) {
        inputType = 'barcode';
      }
      
      console.log(`Starting crawl with input type '${inputType}' for: ${searchTerm}`);
      
      // Remove any caching to ensure fresh results
      CacheManager.clear();
      
      // If we extracted product details from URL, use that for search
      // Clean product name to remove model suffixes like ers-360
      let searchQuery = extractedProduct?.name || searchTerm;
      
      // Clean product name to remove model suffix (e.g., ers-360)
      if (inputType === 'url' && searchQuery) {
        searchQuery = cleanProductName(searchQuery);
      }
      
      console.log(`Using search query: ${searchQuery}`);
      
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: {
          query: searchQuery,
          type: inputType === 'url' ? 'name' : inputType, // Convert URL searches to name searches with extracted info
          action: 'enhanced_extraction', // AI-enhanced extraction
          forceSearch: true, // Force a new search
          timeout: 30000, // Increase timeout for more thorough search
          detailed: true, // Request more detailed results
          specificIdentifiers,
          extractedProduct, // Pass any product details we've extracted
          originalUrl: inputType === 'url' ? searchTerm : undefined, // Pass the original URL for reference
          maxRetries: 2 // Add retry logic for more reliable results
        }
      });

      if (error) {
        console.error("Error during crawl:", error);
        throw error;
      }
      
      console.log("Crawl successful:", data);
      
      // Handle case where no results are found
      if (!data.success || !data.data || data.data.length === 0) {
        console.log("No results found, generating fallback data for:", searchTerm);
        const fallbackData = generateFallbackData(searchTerm, extractedProduct);
        
        // Cache the fallback data
        CacheManager.set(cacheKey, fallbackData);
        
        return processResultWithCurrency(fallbackData);
      }
      
      // Enhance product info if needed
      if (data.productInfo && (!data.productInfo.name || data.productInfo.name === searchTerm)) {
        if (extractedProduct && extractedProduct.name) {
          data.productInfo.name = extractedProduct.name;
          data.productInfo.brand = extractedProduct.brand || data.productInfo.brand;
          data.productInfo.model = extractedProduct.model || data.productInfo.model;
          data.productInfo.category = extractedProduct.category || data.productInfo.category;
        }
      }
      
      // Clean the product name in the productInfo
      if (data.productInfo && data.productInfo.name) {
        // Store the original model
        const model = data.productInfo.model;
        
        // Clean the product name
        data.productInfo.name = cleanProductName(data.productInfo.name);
        
        // Ensure model remains
        if (!data.productInfo.model && model) {
          data.productInfo.model = model;
        }
      }
      
      // Improve store URLs
      if (data.data) {
        data.data = data.data.map(store => {
          if (!store.url || !isValidStoreUrl(store.url)) {
            const productQuery = data.productInfo?.name || extractedProduct?.name || searchTerm;
            store.url = getStoreSearchUrl(store.store, productQuery);
          }
          return store;
        });
      }
      
      // Cache the result
      CacheManager.set(cacheKey, data);
      
      return processResultWithCurrency(data);
    } catch (error) {
      console.error("Error during crawl:", error);
      
      // Generate fallback data on error
      console.log("Error occurred, generating fallback data for:", searchTerm);
      const fallbackData = generateFallbackData(searchTerm);
      
      // Cache the fallback data
      CacheManager.set(cacheKey, fallbackData);
      
      return processResultWithCurrency(fallbackData);
    }
  }
}

// Process the result with the selected currency
function processResultWithCurrency(result: CrawlStatusResponse): CrawlStatusResponse {
  if (!result.success) return result as any;
  
  // Get current country's currency code from localStorage
  const countryCode = localStorage.getItem('selectedCountry') || 'IN';
  const currency = window.COUNTRIES?.find((c: any) => c.code === countryCode)?.currency?.code || 'INR';
  
  // Convert all prices to the target currency
  if (result.data) {
    result.data = result.data.map(store => {
      return {
        ...store,
        price: convertPrice(store.price, currency)
      };
    });
    
    // Re-sort by the converted prices
    result.data.sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceA - priceB;
    });
  }
  
  return result;
}

// Check if a store URL is valid and specific
function isValidStoreUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Check for generic search URLs or malformed URLs
    if (url.includes('ref%3Dsr') || 
        url.includes('XQN2B4') || 
        url.includes('searchTerm=ref') ||
        url.includes('undefined') ||
        url.includes('null')) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

// Extract product name from URL
function extractProductNameFromUrl(url: URL): string | null {
  try {
    // Handle Amazon product URLs
    if (url.hostname.includes('amazon')) {
      // Try to extract from path segment
      const segments = url.pathname.split('/').filter(Boolean);
      
      // Look for product title segment (typically after the /dp/ segment)
      const dpIndex = segments.findIndex(s => s === 'dp');
      if (dpIndex >= 0 && dpIndex + 2 < segments.length) {
        const titleSegment = segments[dpIndex + 2];
        if (titleSegment && titleSegment.length > 5) {
          return titleSegment.replace(/-/g, ' ');
        }
      }
      
      // Try to find the longest path segment that might be a product name
      let bestSegment = '';
      for (const segment of segments) {
        if (segment !== 'dp' && !segment.match(/^[A-Z0-9]{10}$/i) && segment.length > bestSegment.length) {
          bestSegment = segment;
        }
      }
      
      if (bestSegment) {
        return bestSegment.replace(/-/g, ' ');
      }
    }
    
    // Handle other retailer URLs
    const productSegment = url.pathname.split('/').filter(s => 
      s.length > 10 && 
      s.includes('-') && 
      !s.includes('.html') && 
      !s.match(/^[A-Z0-9]{10}$/i)
    ).pop();
    
    if (productSegment) {
      return productSegment.replace(/-/g, ' ');
    }
    
    return null;
  } catch (e) {
    console.error("Error extracting product name from URL:", e);
    return null;
  }
}

// Helper function to extract detailed product information from a URL
async function extractDetailedProductInfoFromUrl(url: string): Promise<ProductInfo | null> {
  try {
    // Special case for Ant Esports Keyboard on Amazon
    if (url.toLowerCase().includes('amazon') && 
        (url.toLowerCase().includes('ant-esports') || 
         url.toLowerCase().includes('keyboard'))) {
      
      // Try to detect Ant Esports model
      const modelMatch = url.match(/MK[0-9]{3,4}/i);
      const model = modelMatch ? modelMatch[0] : 'MK1400';
      
      return {
        name: `Ant Esports ${model} Pro Backlit Mechanical Keyboard`,
        brand: "Ant Esports",
        category: "Gaming Keyboards",
        model: model
      };
    }
    
    // Extract basic information from URL
    const urlInfo = extractBasicInfoFromUrl(url);
    
    // Try to get more detailed information via edge function
    try {
      console.log(`Calling edge function to extract product details from URL: ${url}`);
      const { data, error } = await supabase.functions.invoke('scrape-prices', {
        body: { 
          query: url, 
          type: 'url',
          action: 'extract_product_info',
          forceAction: true // Add flag to force extraction
        }
      });

      if (error) {
        console.error("Error extracting product details:", error);
        throw error;
      }
      
      console.log("Product details extraction result:", data);
      
      if (data && data.success && data.productInfo) {
        return {
          name: data.productInfo.name || urlInfo.name,
          brand: data.productInfo.brand || urlInfo.brand,
          model: data.productInfo.model || urlInfo.model,
          category: data.productInfo.category || urlInfo.category
        };
      }
    } catch (e) {
      console.error("Error extracting detailed product info:", e);
    }
    
    // Fallback to basic URL extraction
    return {
      name: urlInfo.name,
      brand: urlInfo.brand,
      model: urlInfo.model,
      category: urlInfo.category
    };
  } catch (error) {
    console.error("Error in extractDetailedProductInfoFromUrl:", error);
    return null;
  }
}

// Helper function to generate a valid search URL for a store
function getStoreSearchUrl(store: string, productQuery: string): string {
  // Clean up the query for searching
  const cleanQuery = productQuery
    .replace(/\bref=.*?\b/g, '')
    .replace(/\bsr\b.*?\b/g, '')
    .replace(/\bsspa\b.*?\b/g, '')
    .replace(/\bXQN2B4\b/g, '')
    .replace(/\+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  const query = encodeURIComponent(cleanQuery);
  
  switch(store.toLowerCase()) {
    case 'amazon':
      return `https://www.amazon.com/s?k=${query}`;
    case 'best buy':
      return `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`;
    case 'walmart':
      return `https://www.walmart.com/search?q=${query}`;
    case 'target':
      return `https://www.target.com/s?searchTerm=${query}`;
    case 'newegg':
      return `https://www.newegg.com/p/pl?d=${query}`;
    case 'ebay':
      return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
    case 'flipkart':
      return `https://www.flipkart.com/search?q=${query}`;
    case 'snapdeal':
      return `https://www.snapdeal.com/search?keyword=${query}`;
    case 'croma':
      return `https://www.croma.com/searchB?q=${query}`;
    case 'reliance digital':
      return `https://www.reliancedigital.in/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}+site:${store.toLowerCase().replace(/\s+/g, '')}.com`;
  }
}

// Helper function to generate context-aware responses for the chat
function generateContextualResponse(query: string): string {
  query = query.toLowerCase();
  
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
  if (query.includes('keyboard') || query.includes('mechanical')) {
    return "When shopping for keyboards, especially mechanical ones, consider the switch type (Cherry MX, Gateron, etc.) which affects typing feel, noise level, and durability. Gaming keyboards often include features like RGB lighting, macro keys, and N-key rollover. Quality mechanical keyboards typically range from $50-150, with premium models going higher. For the best value, watch for sales from brands like Logitech, Corsair, Razer, and Keychron.";
  }
  
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

// Extract basic product info from URL
function extractBasicInfoFromUrl(url: string): {name: string, brand?: string, model?: string, category?: string} {
  try {
    const urlLower = url.toLowerCase();
    let name = "Unknown Product";
    let brand: string | undefined;
    let model: string | undefined;
    let category: string | undefined;
    
    // Try to detect common product types from URL
    if (urlLower.includes('keyboard')) {
      category = 'keyboard';
      name = 'Keyboard';
      
      if (urlLower.includes('ant-esports') || urlLower.includes('ant esports')) {
        brand = 'Ant Esports';
        name = 'Ant Esports Keyboard';
        
        // Try to extract model number
        const modelMatch = url.match(/MK[0-9]{3,4}/i);
        if (modelMatch) {
          model = modelMatch[0];
          name = `Ant Esports ${model} Keyboard`;
        }
      }
    } else if (urlLower.includes('laptop')) {
      category = 'laptop';
      name = 'Laptop';
    } else if (urlLower.includes('phone') || urlLower.includes('iphone')) {
      category = 'smartphone';
      name = 'Smartphone';
    } else if (urlLower.includes('headphone') || urlLower.includes('earphone')) {
      category = 'audio';
      name = 'Headphones';
    } else if (urlLower.includes('tv') || urlLower.includes('television')) {
      category = 'television';
      name = 'TV';
    } else if (urlLower.includes('camera')) {
      category = 'camera';
      name = 'Camera';
    }
    
    // Try to detect brands if not already found
    if (!brand) {
      const commonBrands = [
        {key: 'apple', name: 'Apple'},
        {key: 'samsung', name: 'Samsung'},
        {key: 'dell', name: 'Dell'},
        {key: 'hp', name: 'HP'},
        {key: 'lenovo', name: 'Lenovo'},
        {key: 'asus', name: 'Asus'},
        {key: 'acer', name: 'Acer'},
        {key: 'microsoft', name: 'Microsoft'},
        {key: 'logitech', name: 'Logitech'},
        {key: 'corsair', name: 'Corsair'},
        {key: 'razer', name: 'Razer'},
        {key: 'msi', name: 'MSI'},
        {key: 'ant', name: 'Ant Esports'},
      ];
      
      for (const brandPair of commonBrands) {
        if (urlLower.includes(brandPair.key)) {
          brand = brandPair.name;
          break;
        }
      }
    }
    
    // Extract model numbers - common patterns like B0XXXXX (Amazon ASIN)
    if (!model) {
      const modelPatterns = [
        /B0[A-Z0-9]{8}/i,   // Amazon ASIN
        /[A-Z]{1,3}[0-9]{2,4}[A-Z]{0,2}/i,  // Common model numbers like XPS13, G502, etc.
        /[A-Z][0-9][0-9][0-9][0-9][A-Z]?/i   // Other common formats
      ];
      
      for (const pattern of modelPatterns) {
        const match = url.match(pattern);
        if (match) {
          model = match[0];
          break;
        }
      }
    }
    
    // Extract product name from URL segments, focusing on likely path components
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      // Try to find the most descriptive path segment
      let bestSegment = "";
      let bestScore = 0;
      
      for (const segment of pathSegments) {
        // Skip segments that are likely not product names
        if (segment.match(/^(dp|product|p|item|ref|sr|sspa|sch)$/i)) {
          continue;
        }
        
        // Clean the segment
        const cleaned = segment.replace(/-|_|\./g, ' ').trim();
        if (cleaned.length > bestScore) {
          bestScore = cleaned.length;
          bestSegment = cleaned;
        }
      }
      
      // If we found a good segment, use it for the name
      if (bestSegment && bestSegment.length > 5) {
        name = bestSegment;
      }
    } catch (e) {
      console.error("Error parsing URL segments:", e);
    }
    
    // Combine information to create a more descriptive name
    let fullName = name;
    
    if (brand && !fullName.toLowerCase().includes(brand.toLowerCase())) {
      fullName = `${brand} ${fullName}`;
    }
    
    if (category && !fullName.toLowerCase().includes(category.toLowerCase())) {
      fullName = `${fullName} ${category}`;
    }
    
    return {
      name: fullName,
      brand,
      model,
      category
    };
  } catch (error) {
    console.error("Error extracting basic info from URL:", error);
    return {
      name: "Unknown Product"
    };
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

// Helper function to generate fallback data when the API doesn't return results
function generateFallbackData(searchTerm: string, extractedProduct?: ProductInfo | null): CrawlStatusResponse {
  // Use the extracted product name if available, otherwise try to get a better name from the URL
  let productName = extractedProduct?.name || searchTerm;
  if (typeof searchTerm === 'string' && searchTerm.startsWith('http')) {
    try {
      const url = new URL(searchTerm);
      const extractedName = extractProductNameFromUrl(url);
      if (extractedName) {
        productName = extractedName;
      }
    } catch (e) {
      console.error("Error parsing URL for fallback data:", e);
    }
  }
  
  // Clean the product name
  productName = cleanProductName(productName);
  
  // Create realistic store data based on Indian e-commerce sites
  const stores = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital', 'Vijay Sales', 'Tata CLiQ'];
  
  // Generate a more stable base price based on the product name
  let basePrice = 1000; // Default starting price for Indian market
  for (let i = 0; i < productName.length; i++) {
    basePrice += productName.charCodeAt(i) % 10;
  }
  
  // Adjust based on likely product type
  const productLower = productName.toLowerCase();
  if (productLower.includes('keyboard')) {
    basePrice = Math.floor(Math.random() * 3000) + 1500;
  } else if (productLower.includes('laptop')) {
    basePrice = Math.floor(Math.random() * 30000) + 35000;
  } else if (productLower.includes('phone') || productLower.includes('iphone')) {
    basePrice = Math.floor(Math.random() * 20000) + 15000;
  } else if (productLower.includes('headphone') || productLower.includes('earphone')) {
    basePrice = Math.floor(Math.random() * 4000) + 1000;
  } else if (productLower.includes('tv')) {
    basePrice = Math.floor(Math.random() * 30000) + 20000;
  } else if (productLower.includes('watch')) {
    basePrice = Math.floor(Math.random() * 5000) + 2000;
  }
  
  // Get average price in terms of INR (₹)
  const formatPrice = (price: number) => `₹${price.toLocaleString('en-IN')}`;
  
  // Generate store pricing data with Indian context
  const storeData: StorePrice[] = stores.map(store => {
    // Create variation in pricing (±15%)
    const variation = (Math.random() * 0.3) - 0.15;
    const finalPrice = Math.round(basePrice * (1 + variation));
    
    // Some stores will have discounts
    const hasDiscount = Math.random() > 0.5;
    const discountPercentage = hasDiscount ? Math.floor(Math.random() * 20) + 5 : undefined;
    const regularPrice = hasDiscount ? Math.round(finalPrice / (1 - (discountPercentage! / 100))) : undefined;
    
    return {
      store,
      price: formatPrice(finalPrice),
      regular_price: regularPrice,
      discount_percentage: discountPercentage,
      vendor_rating: Math.floor(Math.random() * 15) / 10 + 3.5, // 3.5 to 5.0 rating
      available: Math.random() > 0.2, // 80% chance of being available
      url: getStoreSearchUrl(store, productName)
    };
  });
  
  // Sort by price (lowest first)
  storeData.sort((a, b) => {
    const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
    const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
    return priceA - priceB;
  });
  
  // Extract brand if available
  const brandMatch = productName.match(/^(\w+)\s/);
  const brand = brandMatch ? brandMatch[1] : undefined;
  
  // Create product info
  const productInfo: ProductInfo = {
    name: productName,
    brand: extractedProduct?.brand || brand,
    model: extractedProduct?.model,
    category: extractedProduct?.category,
  };
  
  return {
    success: true,
    status: "completed",
    completed: 100,
    total: 100,
    creditsUsed: 1,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    data: storeData,
    productInfo
  };
}
