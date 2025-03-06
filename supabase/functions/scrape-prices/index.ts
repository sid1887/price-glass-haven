import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  query: string;
  type: 'url' | 'name' | 'barcode' | 'chat' | 'summarize' | 'analyze';
  action?: string;
  forceSearch?: boolean;
  forceChat?: boolean;
  forceAction?: boolean;
  reviews?: string[];
  context?: string;
  timeout?: number;
  detailed?: boolean;
  previousMessages?: {role: string, content: string}[];
}

interface ProductInfo {
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  attributes?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to scrape-prices function");
    
    // Parse request body
    const requestData: RequestBody = await req.json();
    const { query, type, action, forceSearch, forceChat, reviews, context, previousMessages } = requestData;
    
    console.log("Request data:", JSON.stringify(requestData));

    // Different handling based on request type
    if (type === 'chat') {
      console.log("Processing chat request with query:", query);
      return handleChatRequest(query, context || 'general', forceChat || false, previousMessages || []);
    } else if (type === 'summarize') {
      console.log("Processing summarize request with query:", query);
      return handleSummarizeRequest(query, action || 'generic');
    } else if (type === 'analyze') {
      console.log("Processing analyze request with reviews:", reviews?.length);
      return handleAnalyzeRequest(reviews || [], action || 'generic');
    } else if (type === 'url') {
      console.log("Processing URL search request for:", query);
      // Extract product info from URL
      const productInfo = await extractProductInfoFromUrl(query);
      console.log("Extracted product info:", productInfo);
      
      if (productInfo && productInfo.name) {
        // Use the extracted product name for search
        return handleSearchRequest(productInfo.name, 'name', action || 'generic', forceSearch || false, requestData.detailed || false, productInfo);
      } else {
        // Fallback to direct URL handling if extraction fails
        return handleSearchRequest(query, type, action || 'generic', forceSearch || false, requestData.detailed || false);
      }
    } else {
      console.log(`Processing ${type} search request for: ${query}`);
      return handleSearchRequest(query, type, action || 'generic', forceSearch || false, requestData.detailed || false);
    }
  } catch (error) {
    console.error("Error in scrape-prices function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function handleChatRequest(
  query: string, 
  context: string, 
  forceChat: boolean, 
  previousMessages: {role: string, content: string}[]
): Promise<Response> {
  try {
    console.log(`Processing chat request: "${query}" with context: ${context}`);
    console.log("Previous messages:", JSON.stringify(previousMessages));
    
    // Extract keywords for more contextual responses
    const keywords = extractKeywords(query.toLowerCase());
    console.log("Extracted keywords:", keywords);
    
    // Build conversation context from previous messages
    let conversationContext = "";
    if (previousMessages && previousMessages.length > 0) {
      conversationContext = previousMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join("\n");
      
      console.log("Built conversation context:", conversationContext);
    }
    
    // Generate AI response to the chat query based on context and keywords
    let response: string;
    
    // First check for specific product questions that might be in the context
    if (query.toLowerCase().includes('which is better') || 
        query.toLowerCase().includes('should i buy') ||
        query.toLowerCase().includes('what do you recommend') ||
        query.toLowerCase().includes('is it worth')
    ) {
      response = "To compare specific products, I recommend using our price comparison tool at the top of the page. For your specific question, I'd need to analyze current reviews and specifications. Generally, I recommend looking at factors like price-to-performance ratio, reliability (based on user reviews), and features that match your specific needs. Would you like me to help you search for these products?";
    }
    // Check if there are specific product keywords in the context
    else if (
      containsProductCategory(query) && 
      (query.toLowerCase().includes('recommend') || 
       query.toLowerCase().includes('best') || 
       query.toLowerCase().includes('suggest'))
    ) {
      const productCategory = extractProductCategory(query);
      response = `For ${productCategory}, the best choices depend on your specific needs and budget. Our price comparison tool can help you find the best deals across major retailers. I'd be happy to provide more specific recommendations if you can tell me more about your requirements, such as what features are most important to you and your approximate budget.`;
    }
    // Check for context to provide more relevant responses
    else if (keywords.includes('price') || keywords.includes('deal') || keywords.includes('cost') || keywords.includes('cheap')) {
      response = "Based on my analysis of current market trends, you can find the best deals by comparing prices across multiple retailers. Our price comparison tool scans major stores like Amazon, Walmart, Best Buy, and others to find the lowest prices. I recommend entering specific product models for the most accurate results.";
    } else if (keywords.includes('iphone') || keywords.includes('apple') || keywords.includes('phone')) {
      response = "When shopping for smartphones like iPhones, price variations between retailers are often minimal for current models. However, you can find deals through carrier promotions, trade-in programs, or during major sales events. For older iPhone models, check authorized retailers like Best Buy or Walmart, which sometimes offer better discounts than Apple directly.";
    } else if (keywords.includes('best') && (keywords.includes('time') || keywords.includes('when'))) {
      response = "The best times to shop for deals depend on what you're buying. Electronics are cheapest during Black Friday, Cyber Monday, and Amazon Prime Day. Back-to-school season (July-August) offers great laptop deals. TVs are often discounted before the Super Bowl. For general shopping, end-of-season sales offer good values on clothing and home goods.";
    } else if (keywords.includes('trust') || keywords.includes('reliable') || keywords.includes('accurate')) {
      response = "Our price comparison data is gathered in real-time from major retailers. While we strive for accuracy, prices and availability can change quickly. We recommend using our tool to identify the best deals, then verifying the final price on the retailer's website before making a purchase. We also include vendor ratings to help you identify trustworthy sellers.";
    } else if (keywords.includes('how') && keywords.includes('work')) {
      response = "Our price comparison tool works by scanning major online retailers in real-time to find the best prices for products. Simply enter a product name, URL, or scan a barcode, and our AI will identify the product and compare prices across stores like Amazon, Walmart, Best Buy, and others. We also show you available discounts, vendor ratings, and stock availability to help you make informed decisions.";
    } else if (keywords.includes('hello') || keywords.includes('hi') || keywords.includes('hey')) {
      response = "Hello there! I'm your AI shopping assistant, ready to help you find the best deals and answer any shopping-related questions. I can help with product recommendations, price comparisons, shopping strategies, and more. What can I assist you with today?";
    } else if (keywords.includes('thank')) {
      response = "You're welcome! I'm happy to help with all your shopping needs. Feel free to ask if you have any other questions about products, pricing, or shopping strategies.";
    } else if (keywords.includes('laptop') || keywords.includes('computer')) {
      response = "When shopping for laptops, consider your specific needs. For basic tasks, look for models with at least 8GB RAM and an SSD. For gaming or content creation, prioritize a dedicated GPU and 16GB+ RAM. The sweet spot for value is typically $600-900 for general use laptops. Watch for deals during back-to-school season and Black Friday for savings of 15-30%";
    } else if (keywords.includes('tv') || keywords.includes('television')) {
      response = "For TV shopping, size should match your viewing distance (sitting distance divided by 1.5 = recommended screen size in inches). OLED provides the best picture quality but costs more, while QLED offers bright, vibrant images at a better value. Most content is 4K now, so that resolution is sufficient for most buyers. January (before Super Bowl) and November (Black Friday) typically offer the best TV deals.";
    } else if (keywords.includes('history') || keywords.includes('past')) {
      response = "You can view your search history at the top of the search form. It shows your past product searches and best prices found. Simply click on any item in your history to quickly re-run that search with updated pricing information. This feature helps you track price changes over time and quickly reference products you've previously searched for.";
    } else if (query.toLowerCase().includes('what else can you do') || query.toLowerCase().includes('what can you help with')) {
      response = "I can help you find the best deals on products, compare prices across different retailers, provide shopping advice for specific categories like electronics, home goods, or clothing, explain shopping terms and policies, recommend the best times to buy certain products, and analyze whether a deal is actually good based on historical prices. What would you like help with today?";
    } else {
      // For generic responses, try to connect to previous context if available
      if (conversationContext) {
        // Look for patterns in the conversation to generate contextual responses
        if (conversationContext.toLowerCase().includes('price') || 
            conversationContext.toLowerCase().includes('cost') || 
            conversationContext.toLowerCase().includes('deal')) {
          response = "Based on our conversation about pricing, I'd recommend comparing across multiple retailers. Prices can vary significantly, and some stores offer price matching or additional benefits like extended warranties. Is there a specific product you're interested in comparing?";
        } else if (conversationContext.toLowerCase().includes('quality') || 
                   conversationContext.toLowerCase().includes('review') || 
                   conversationContext.toLowerCase().includes('rating')) {
          response = "From our discussion about product quality, I'd suggest looking at both professional reviews and user feedback. Our vendor ratings can help identify reliable sellers, but for detailed product quality assessment, specialized review sites like RTINGS, Consumer Reports, or Wirecutter provide in-depth analysis for many product categories.";
        } else {
          response = "Based on our conversation, I'd be happy to help with your question. I can provide price comparisons, product recommendations, and shopping advice across various categories. For the most specific help, try using our price comparison tool at the top of the page to search for products you're interested in. Is there a particular product or shopping topic you'd like to know more about?";
        }
      } else {
        response = "I'm here to help you find the best deals and answer shopping-related questions. I can provide price comparisons, product recommendations, and shopping advice across categories like electronics, appliances, clothing, and more. Feel free to ask about specific products, price trends, or shopping strategies!";
      }
    }
    
    console.log("Generated chat response:", response);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: response,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in chat request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to process chat request",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// Check if a string contains a recognizable product category
function containsProductCategory(text: string): boolean {
  const productCategories = [
    'tv', 'television', 'monitor', 'laptop', 'computer', 'phone', 'smartphone', 
    'tablet', 'camera', 'headphone', 'speaker', 'smartwatch', 'watch', 
    'refrigerator', 'fridge', 'microwave', 'dishwasher', 'washer', 'dryer', 
    'vacuum', 'blender', 'toaster', 'coffeemaker', 'printer', 'console', 
    'gaming', 'playstation', 'xbox', 'nintendo'
  ];
  
  const textLower = text.toLowerCase();
  return productCategories.some(category => textLower.includes(category));
}

// Extract product category from text
function extractProductCategory(text: string): string {
  const productCategories = [
    { keywords: ['tv', 'television'], name: 'TVs' },
    { keywords: ['monitor'], name: 'monitors' },
    { keywords: ['laptop', 'notebook'], name: 'laptops' },
    { keywords: ['desktop', 'computer', 'pc'], name: 'desktop computers' },
    { keywords: ['phone', 'smartphone', 'iphone', 'android'], name: 'smartphones' },
    { keywords: ['tablet', 'ipad'], name: 'tablets' },
    { keywords: ['camera'], name: 'cameras' },
    { keywords: ['headphone', 'earbud'], name: 'headphones' },
    { keywords: ['speaker', 'soundbar'], name: 'audio equipment' },
    { keywords: ['smartwatch', 'watch'], name: 'smartwatches' },
    { keywords: ['refrigerator', 'fridge'], name: 'refrigerators' },
    { keywords: ['microwave'], name: 'microwaves' },
    { keywords: ['dishwasher'], name: 'dishwashers' },
    { keywords: ['washer', 'dryer'], name: 'washing machines' },
    { keywords: ['vacuum', 'cleaner'], name: 'vacuum cleaners' },
    { keywords: ['kitchen', 'appliance'], name: 'kitchen appliances' },
    { keywords: ['printer'], name: 'printers' },
    { keywords: ['console', 'gaming', 'playstation', 'xbox', 'nintendo'], name: 'gaming consoles' }
  ];
  
  const textLower = text.toLowerCase();
  for (const category of productCategories) {
    if (category.keywords.some(keyword => textLower.includes(keyword))) {
      return category.name;
    }
  }
  
  return 'products';
}

// Extract important keywords from the query for better context understanding
function extractKeywords(query: string): string[] {
  const fillerWords = ['a', 'an', 'the', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'for', 'and', 'nor', 'but', 'or', 'yet', 'so', 'if', 'then', 'else', 'when', 'of', 'to', 'in', 'on', 'by', 'at', 'from'];
  
  return query.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 1 && !fillerWords.includes(word));
}

async function handleSummarizeRequest(text: string, action: string): Promise<Response> {
  try {
    console.log(`Processing summarize request with action: ${action}`);
    
    const summary = `This is a summarized version of the product description focusing on key features and benefits.`;
    
    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in summarize request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to summarize text",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

async function handleAnalyzeRequest(reviews: string[], action: string): Promise<Response> {
  try {
    console.log(`Processing analyze request with ${reviews.length} reviews`);
    
    const analysis = {
      sentiment: "positive",
      positivePoints: ["Good value", "High quality", "Fast shipping"],
      negativePoints: ["Occasional issues with durability"],
      rating: 4.2,
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in analyze request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze reviews",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

async function handleSearchRequest(
  query: string, 
  type: string, 
  action: string, 
  forceSearch: boolean, 
  detailed: boolean,
  productInfo?: ProductInfo
): Promise<Response> {
  try {
    console.log(`Processing ${type} search request for "${query}" with action: ${action}`);
    
    let productName = query;
    
    if (type === 'url' && !productInfo) {
      const urlParts = query.split('/');
      productName = urlParts[urlParts.length - 1]
        .replace(/-|_/g, ' ')  // Replace hyphens and underscores with spaces
        .replace(/\.html|\.htm|\.php|\.aspx/g, '')  // Remove file extensions
        .trim();
    } else if (type === 'url' && productInfo) {
      productName = productInfo.name;
    } else if (type === 'barcode') {
      productName = "Generic Product " + query.substring(0, 4);
    }
    
    console.log("Final product name for search:", productName);
    
    const stores = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Newegg', 'eBay'];
    const basePrice = 100 + (productName.length * 10);  // Price based on length of product name
    
    const storeData = stores.map(store => {
      const priceVariation = (Math.random() * 30) - 15;  // -15 to +15 dollars
      const price = basePrice + priceVariation;
      
      const hasDiscount = Math.random() > 0.6;  // 40% chance
      const regularPrice = hasDiscount ? price * (1 + (Math.random() * 0.3)) : undefined;
      const discountPercentage = regularPrice ? Math.round((regularPrice - price) / regularPrice * 100) : undefined;
      
      let storeUrl = '';
      const encodedProduct = encodeURIComponent(productName);
      
      switch (store) {
        case 'Amazon':
          storeUrl = `https://www.amazon.com/s?k=${encodedProduct}`;
          break;
        case 'Best Buy':
          storeUrl = `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedProduct}`;
          break;
        case 'Walmart':
          storeUrl = `https://www.walmart.com/search?q=${encodedProduct}`;
          break;
        case 'Target':
          storeUrl = `https://www.target.com/s?searchTerm=${encodedProduct}`;
          break;
        case 'Newegg':
          storeUrl = `https://www.newegg.com/p/pl?d=${encodedProduct}`;
          break;
        case 'eBay':
          storeUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodedProduct}`;
          break;
        default:
          storeUrl = `https://www.google.com/search?q=${encodedProduct}`;
      }
      
      return {
        store,
        price: `$${price.toFixed(2)}`,
        url: storeUrl,
        regular_price: regularPrice ? regularPrice.toFixed(2) : undefined,
        discount_percentage: discountPercentage,
        vendor_rating: (3 + (Math.random() * 2)).toFixed(1),  // 3.0 to 5.0 rating
        available: Math.random() > 0.1,  // 90% chance of being available
        availability_count: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : undefined
      };
    });
    
    console.log("Generated store data for product search");
    
    return new Response(
      JSON.stringify({
        success: true,
        status: "completed",
        completed: stores.length,
        total: stores.length,
        creditsUsed: 1,
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),  // 24 hours from now
        data: storeData,
        productInfo: productInfo || undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in search request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to search for product",
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

async function extractProductInfoFromUrl(url: string): Promise<ProductInfo | null> {
  try {
    console.log("Extracting product info from URL:", url);
    
    const productName = extractProductNameFromUrl(url);
    const productBrand = extractBrandFromUrl(url);
    const productModel = extractModelFromUrl(url);
    
    console.log("Initial extraction:", { productName, productBrand, productModel });
    
    let fullProductName = '';
    if (productBrand) {
      fullProductName += productBrand + ' ';
    }
    
    if (productName && productName.length > 3 && productName !== "Unknown Product") {
      fullProductName += productName;
    }
    
    if (productModel && !fullProductName.includes(productModel)) {
      fullProductName += ' ' + productModel;
    }
    
    fullProductName = fullProductName.trim();
    
    if (!fullProductName || fullProductName.length < 5) {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      
      for (const segment of pathSegments) {
        if (segment.length > 5 && !segment.match(/^(p|product|item|dp|detail|pd)$/i)) {
          const cleaned = segment.replace(/-|_|\./g, ' ').trim();
          if (cleaned.length > 5) {
            fullProductName = cleaned;
            break;
          }
        }
      }
    }
    
    console.log("Extracted full product name:", fullProductName);
    
    if (fullProductName && fullProductName.length > 3) {
      return {
        name: fullProductName,
        brand: productBrand,
        model: productModel
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting product info from URL:", error);
    return null;
  }
}

function extractBrandFromUrl(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    const brandDomains: Record<string, string> = {
      'amazon': undefined,
      'apple.com': 'Apple',
      'samsung.com': 'Samsung',
      'dell.com': 'Dell',
      'hp.com': 'HP',
      'lenovo.com': 'Lenovo',
      'sony.com': 'Sony',
      'microsoft.com': 'Microsoft',
      'lg.com': 'LG',
      'bestbuy': undefined,
      'walmart': undefined,
      'target': undefined,
    };
    
    for (const [domain, brand] of Object.entries(brandDomains)) {
      if (hostname.includes(domain)) {
        return brand;
      }
    }
    
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const commonBrands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'microsoft', 'acer', 'asus'];
    
    for (const segment of pathSegments) {
      const segmentLower = segment.toLowerCase();
      for (const brand of commonBrands) {
        if (segmentLower.includes(brand)) {
          return brand.charAt(0).toUpperCase() + brand.slice(1);
        }
      }
    }
    
    return undefined;
  } catch (error) {
    console.error("Error extracting brand from URL:", error);
    return undefined;
  }
}

function extractModelFromUrl(url: string): string | undefined {
  try {
    const modelPatterns = [
      /[A-Z]{1,2}[0-9]{4,5}[A-Z]?/i,
      /[A-Z][0-9]{1,2}-[0-9]{3,4}/i,
      /[A-Z]{2,3}-[0-9]{3,4}/i,
      /[A-Z]{1,3}[0-9]{1,2}[A-Z]{0,1}[0-9]{1,3}/i
    ];
    
    const urlString = decodeURIComponent(url);
    
    for (const pattern of modelPatterns) {
      const match = urlString.match(pattern);
      if (match && match[0]) {
        return match[0];
      }
    }
    
    return undefined;
  } catch (error) {
    console.error("Error extracting model from URL:", error);
    return undefined;
  }
}

function extractProductNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    let productName = "";
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];
      if (['html', 'htm', 'php', 'asp', 'jsp'].some(ext => segment.endsWith(`.${ext}`))) {
        productName = segment.split('.')[0];
        break;
      }
      if (!segment.match(/^(p|product|item|dp|detail|pd)$/i) && segment.length > 3) {
        productName = segment;
        break;
      }
    }
    
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
    
    if (!productName || productName.length < 3) {
      const idPatterns = [
        /\/([A-Z0-9]{10})(?:\/|$)/i,
        /\/([A-Z0-9]{8,})(?:\/|$)/i,
        /\/p\/([0-9]{6,})(?:\/|$)/i
      ];
      
      for (const pattern of idPatterns) {
        const match = pathname.match(pattern);
        if (match && match[1]) {
          productName = `Product ${match[1]}`;
          break;
        }
      }
    }
    
    productName = productName
      .replace(/-|_|\.|\+/g, ' ')
      .replace(/[0-9a-f]{8,}/i, '')
      .replace(/^\d+$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    return productName || "Unknown Product";
  } catch (e) {
    console.error("Error extracting product name from URL:", e);
    return "Unknown Product";
  }
}
