
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

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  static async lookupProductWithGemini(query: string): Promise<any> {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || '',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Find product details for: ${query}. Return a JSON with name, category, and likely price range in INR.`
            }]
          }]
        })
      });

      const data = await response.json();
      console.log('Gemini response:', data);

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        try {
          const productInfo = JSON.parse(data.candidates[0].content.parts[0].text) as ProductInfo;
          return {
            success: true,
            product: productInfo
          };
        } catch (e) {
          console.error('Error parsing Gemini response:', e);
          return {
            success: false,
            error: 'Failed to parse product information'
          };
        }
      }

      return {
        success: false,
        error: 'No product information found'
      };
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        success: false,
        error: 'Failed to process product query'
      };
    }
  }

  private static async lookupBarcode(barcode: string): Promise<any> {
    try {
      // First try UPC Database
      const response = await fetch(`https://api.upcdatabase.org/product/${barcode}`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          product: data
        };
      }
      
      // If UPC Database fails, use Gemini to analyze the barcode
      return this.lookupProductWithGemini(barcode);
    } catch (error) {
      console.error('Barcode lookup error:', error);
      // Fallback to Gemini
      return this.lookupProductWithGemini(barcode);
    }
  }

  private static async scrapeProductDetails(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch URL');
      }
      
      const html = await response.text();
      
      // Extract basic metadata
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : '';
      
      // Use Gemini to analyze the page content
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || '',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this product page HTML and extract product details. HTML: ${html.substring(0, 1000)}... Return a JSON with name, price, brand, and category.`
            }]
          }]
        })
      });

      const analysisData = await geminiResponse.json();
      let productInfo: ProductInfo = {};
      
      if (analysisData.candidates?.[0]?.content?.parts?.[0]?.text) {
        try {
          productInfo = JSON.parse(analysisData.candidates[0].content.parts[0].text) as ProductInfo;
        } catch (e) {
          console.error('Error parsing Gemini analysis:', e);
        }
      }

      return {
        success: true,
        product: {
          name: productInfo.name || title,
          ...productInfo,
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

  private static async searchPricesAcrossStores(productName: string): Promise<CrawlResponse> {
    try {
      const stores = [
        { name: 'Amazon', baseUrl: 'https://www.amazon.in' },
        { name: 'Flipkart', baseUrl: 'https://www.flipkart.com' },
        { name: 'Meesho', baseUrl: 'https://www.meesho.com' }
      ];

      const searchPromises = stores.map(async (store) => {
        try {
          const encodedName = encodeURIComponent(productName);
          const searchUrl = `${store.baseUrl}/search?q=${encodedName}`;
          
          const response = await fetch(searchUrl);
          const html = await response.text();

          // Use Gemini to analyze the search results
          const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': process.env.GEMINI_API_KEY || '',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analyze this e-commerce search result page and find the best matching product for "${productName}". Extract price, URL, and any available offers. HTML: ${html.substring(0, 1000)}...`
                }]
              }]
            })
          });

          const analysisData = await geminiResponse.json();
          let productData: ProductInfo = {};
          
          if (analysisData.candidates?.[0]?.content?.parts?.[0]?.text) {
            try {
              productData = JSON.parse(analysisData.candidates[0].content.parts[0].text) as ProductInfo;
            } catch (e) {
              console.error(`Error parsing ${store.name} results:`, e);
            }
          }

          return {
            store: store.name,
            price: productData.price || 'N/A',
            url: productData.url || searchUrl,
            regular_price: productData.regular_price,
            discount_percentage: productData.discount_percentage,
            vendor_rating: productData.vendor_rating,
            available: productData.available !== false,
            availability_count: productData.availability_count,
            offers: productData.offers || []
          };
        } catch (error) {
          console.error(`Error searching ${store.name}:`, error);
          return {
            store: store.name,
            price: 'Error',
            url: store.baseUrl
          };
        }
      });

      const results = await Promise.all(searchPromises);
      const validResults = results.filter(result => result.price !== 'Error');

      if (validResults.length === 0) {
        return {
          success: false,
          error: "No valid prices found"
        };
      }

      return {
        success: true,
        status: "completed",
        completed: validResults.length,
        total: stores.length,
        creditsUsed: validResults.length,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: validResults
      };
    } catch (error) {
      console.error("Error searching prices:", error);
      return {
        success: false,
        error: "Failed to fetch prices from stores"
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
