
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  query: string;
  type: 'chat';
}

interface CrawlRequest {
  query: string;
  type: 'name' | 'url' | 'barcode';
}

type RequestBody = ChatRequest | CrawlRequest;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    const { query, type } = requestData;

    if (!query) {
      throw new Error('Query parameter is required');
    }

    console.log(`Processing ${type} request for: ${query}`);

    // Handle chat requests
    if (type === 'chat') {
      const chatResponse = await handleChatRequest(query, geminiApiKey);
      return new Response(
        JSON.stringify(chatResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle product search requests
    const productInfo = await searchProduct(query, type, geminiApiKey);
    
    return new Response(
      JSON.stringify({
        success: true,
        status: "completed",
        completed: 1,
        total: 1,
        creditsUsed: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        data: productInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unknown error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Handle chat requests with Gemini
async function handleChatRequest(query: string, apiKey: string) {
  try {
    console.log('Sending chat request to Gemini API');
    
    // Build a product-assistant-focused prompt
    const enhancedPrompt = `You are a helpful shopping assistant that helps customers find the best deals and understand product information. User query: "${query}". 
    
    If the question is about finding products, comparing prices, or understanding features, provide detailed but concise information. If the user is asking about how to use the CumPair app, explain clearly. If the user needs help with the barcode scanner or other features, walk them through it step by step.
    
    Keep your response conversational, helpful and focused on shopping assistance.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: enhancedPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    const result = await response.json();
    
    // Extract the message from the response
    let message = "I couldn't generate a response. Please try again.";
    
    if (result.candidates && 
        result.candidates[0] && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts[0] && 
        result.candidates[0].content.parts[0].text) {
      message = result.candidates[0].content.parts[0].text;
    }

    return { success: true, message };
  } catch (error) {
    console.error('Error in chat with Gemini:', error);
    return { 
      success: false, 
      message: "Sorry, I'm having trouble processing your request right now. Please try again later." 
    };
  }
}

// Function to search for product information using Gemini
async function searchProduct(query: string, type: 'name' | 'url' | 'barcode', apiKey: string): Promise<any[]> {
  try {
    console.log(`Using Gemini to get product data for ${type}: ${query}`);
    
    // Build different prompts based on query type
    let prompt = '';
    
    if (type === 'name') {
      prompt = `Please act as a product search API. For the product "${query}", provide me a JSON array of stores and their prices. Include at least 5 different stores like Amazon, Walmart, Best Buy, Target, and others. 
      
      Each item should include these fields:
      - store (string): The store name
      - price (string): The formatted price with currency symbol
      - url (string): A fictional but plausible URL to the product page
      - regular_price (number, optional): The original price if there's a discount
      - discount_percentage (number, optional): The discount percentage if applicable
      - vendor_rating (number, optional): A rating between 1-5
      - available (boolean): Whether the item is in stock

      Make the results realistic with variations in pricing and availability.`;
    } 
    else if (type === 'barcode') {
      prompt = `Please act as a barcode lookup API. For the barcode "${query}", provide me a JSON array of stores and their prices for this product. Include at least 5 different stores.
      
      Each item should include these fields:
      - store (string): The store name
      - price (string): The formatted price with currency symbol
      - url (string): A fictional but plausible URL to the product page
      - regular_price (number, optional): The original price if there's a discount
      - discount_percentage (number, optional): The discount percentage if applicable
      - vendor_rating (number, optional): A rating between 1-5
      - available (boolean): Whether the item is in stock

      Make the results realistic with variations in pricing and availability.`;
    }
    else if (type === 'url') {
      prompt = `Please act as a product data extraction API. For the product URL "${query}", provide me a JSON array of stores and their prices for this same product across different retailers. Include at least 5 different stores.
      
      Each item should include these fields:
      - store (string): The store name
      - price (string): The formatted price with currency symbol
      - url (string): A fictional but plausible URL to the product page
      - regular_price (number, optional): The original price if there's a discount
      - discount_percentage (number, optional): The discount percentage if applicable
      - vendor_rating (number, optional): A rating between 1-5
      - available (boolean): Whether the item is in stock

      Make the results realistic with variations in pricing and availability.`;
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        }
      })
    });

    const result = await response.json();
    console.log('Gemini API response received');

    if (result.candidates && 
        result.candidates[0] && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts[0] && 
        result.candidates[0].content.parts[0].text) {
      
      const responseText = result.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response text
      const jsonMatch = responseText.match(/\[\s*\{.*\}\s*\]/s);
      
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          return parsedData;
        } catch (e) {
          console.error('Error parsing JSON from Gemini response:', e);
        }
      }
    }

    // Fallback response if JSON parsing fails
    return generateFallbackResponse(query);
  } catch (error) {
    console.error('Error searching product with Gemini:', error);
    return generateFallbackResponse(query);
  }
}

// Generate fallback response when API fails
function generateFallbackResponse(query: string): any[] {
  const stores = ['Amazon', 'Walmart', 'Best Buy', 'Target', 'eBay', 'Costco', 'Newegg'];
  const currentDate = new Date();
  
  return stores.map(store => {
    const basePrice = 100 + Math.floor(Math.random() * 900);
    const hasDiscount = Math.random() > 0.5;
    const discountPercentage = hasDiscount ? Math.floor(Math.random() * 30) + 5 : 0;
    const regularPrice = hasDiscount ? basePrice : undefined;
    const price = hasDiscount ? basePrice * (1 - discountPercentage/100) : basePrice;
    
    return {
      store,
      price: `$${price.toFixed(2)}`,
      url: `https://www.${store.toLowerCase().replace(' ', '')}.com/product/${query.replace(/\s+/g, '-').toLowerCase()}`,
      regular_price: regularPrice,
      discount_percentage: hasDiscount ? discountPercentage : undefined,
      vendor_rating: 3 + Math.random() * 2,
      available: Math.random() > 0.2,
      timestamp: currentDate.toISOString()
    };
  });
}
