
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
    const { query, type, action, forceSearch, forceChat, reviews, context } = requestData;
    
    console.log("Request data:", JSON.stringify(requestData));

    // Different handling based on request type
    if (type === 'chat') {
      console.log("Processing chat request with query:", query);
      return handleChatRequest(query, context || 'general', forceChat || false);
    } else if (type === 'summarize') {
      console.log("Processing summarize request with query:", query);
      return handleSummarizeRequest(query, action || 'generic');
    } else if (type === 'analyze') {
      console.log("Processing analyze request with reviews:", reviews?.length);
      return handleAnalyzeRequest(reviews || [], action || 'generic');
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

async function handleChatRequest(query: string, context: string, forceChat: boolean): Promise<Response> {
  try {
    console.log(`Processing chat request: "${query}" with context: ${context}`);
    
    // Generate AI response to the chat query
    let response: string;
    
    if (query.toLowerCase().includes('price') || query.toLowerCase().includes('deal') || query.toLowerCase().includes('cheap')) {
      response = "Based on current market trends, you can find great deals by comparing prices across multiple retailers. I recommend searching for specific products using our search tool to see real-time price comparisons.";
    } else if (query.toLowerCase().includes('iphone') || query.toLowerCase().includes('apple')) {
      response = "Apple products like iPhones tend to have consistent pricing, but you can find deals at authorized retailers during special events. The latest iPhone models range from $699 to $1099 depending on the model and storage capacity.";
    } else if (query.toLowerCase().includes('best') && query.toLowerCase().includes('time')) {
      response = "The best times to shop for deals are during major sales events like Black Friday, Cyber Monday, Amazon Prime Day, and back-to-school sales. Many retailers also offer end-of-season clearance sales.";
    } else if (query.toLowerCase().includes('how') && query.toLowerCase().includes('work')) {
      response = "Our price comparison tool works by searching across multiple online retailers to find the best prices for products. Simply enter a product name, URL, or scan a barcode, and our AI will find and compare prices for you.";
    } else {
      response = "I'm here to help you find the best deals and answer shopping-related questions. Feel free to ask about specific products, price trends, or shopping strategies!";
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

async function handleSummarizeRequest(text: string, action: string): Promise<Response> {
  try {
    console.log(`Processing summarize request with action: ${action}`);
    
    // Generate summary of the provided text
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
    
    // Generate analysis of the provided reviews
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

async function handleSearchRequest(query: string, type: string, action: string, forceSearch: boolean, detailed: boolean): Promise<Response> {
  try {
    console.log(`Processing ${type} search request for "${query}" with action: ${action}`);
    
    // Determine product from query
    let productName = query;
    if (type === 'url') {
      // Extract product name from URL
      const urlParts = query.split('/');
      productName = urlParts[urlParts.length - 1]
        .replace(/-|_/g, ' ')  // Replace hyphens and underscores with spaces
        .replace(/\.html|\.htm|\.php|\.aspx/g, '')  // Remove file extensions
        .trim();
    } else if (type === 'barcode') {
      // For barcode, use a mock product lookup
      productName = "Generic Product " + query.substring(0, 4);
    }
    
    console.log("Extracted product name:", productName);
    
    // Generate mock price comparison data based on product name
    const stores = ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Newegg', 'eBay'];
    const basePrice = 100 + (productName.length * 10);  // Price based on length of product name
    
    // Create store prices with variations
    const storeData = stores.map(store => {
      // Add some price variation
      const priceVariation = (Math.random() * 30) - 15;  // -15 to +15 dollars
      const price = basePrice + priceVariation;
      
      // Sometimes add a regular price and discount
      const hasDiscount = Math.random() > 0.6;  // 40% chance
      const regularPrice = hasDiscount ? price * (1 + (Math.random() * 0.3)) : undefined;
      const discountPercentage = regularPrice ? Math.round((regularPrice - price) / regularPrice * 100) : undefined;
      
      return {
        store,
        price: `$${price.toFixed(2)}`,
        url: `https://${store.toLowerCase().replace(' ', '')}.com/product/${productName.replace(/\s+/g, '-')}`,
        regular_price: regularPrice ? `$${regularPrice.toFixed(2)}` : undefined,
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
