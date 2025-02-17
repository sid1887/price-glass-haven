
import { serve } from "https://deno.fresh.dev/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface ScrapeRequest {
  query: string;
  type: 'name' | 'url' | 'barcode';
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json() as ScrapeRequest;

    // Use Gemini AI to get product information
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') || '',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Find product details for: ${query}. Analyze likely prices on major Indian e-commerce platforms (Amazon.in, Flipkart, Meesho). Return a JSON array with store names and estimated prices.`
          }]
        }]
      })
    });

    const geminiData = await geminiResponse.json();
    let prices: StorePrice[] = [];

    if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      try {
        const results = JSON.parse(geminiData.candidates[0].content.parts[0].text);
        if (Array.isArray(results)) {
          prices = results;
        }
      } catch (e) {
        console.error('Error parsing Gemini results:', e);
      }
    }

    if (prices.length === 0) {
      // Fallback default responses if Gemini fails
      prices = [
        {
          store: 'Amazon',
          price: 'Price unavailable',
          url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`
        },
        {
          store: 'Flipkart',
          price: 'Price unavailable',
          url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`
        },
        {
          store: 'Meesho',
          price: 'Price unavailable',
          url: `https://www.meesho.com/search?q=${encodeURIComponent(query)}`
        }
      ];
    }

    return new Response(JSON.stringify({
      success: true,
      status: "completed",
      completed: prices.length,
      total: prices.length,
      creditsUsed: 1,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      data: prices
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in scrape-prices function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch prices'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
