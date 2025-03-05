
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, MessageCircle, Loader2 } from "lucide-react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

export const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm your AI shopping assistant. How can I help you find the best deals today?",
      sender: "ai",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    // Add typing indicator
    const typingIndicator: Message = {
      text: "",
      sender: 'ai',
      timestamp: new Date(),
      isTyping: true
    };
    
    setMessages(prev => [...prev, typingIndicator]);
    
    try {
      // Send message to AI with 12-second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 12000);
      });
      
      const responsePromise = FirecrawlService.askGeminiAI(message);
      
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add AI response to chat
      const aiMessage: Message = {
        text: response.success 
          ? response.message 
          : "I'm having trouble connecting to my knowledge base right now. Let me try a different approach...",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Reset consecutive errors count on success
      setConsecutiveErrors(0);
      
      // If the first approach failed, try a fallback approach
      if (!response.success) {
        // Add typing indicator
        setMessages(prev => [...prev, {
          text: "",
          sender: 'ai',
          timestamp: new Date(),
          isTyping: true
        }]);
        
        setTimeout(() => {
          // Remove typing indicator
          setMessages(prev => prev.filter(msg => !msg.isTyping));
          
          const fallbackResponse = generateDetailedResponse(message);
          const fallbackMessage: Message = {
            text: fallbackResponse,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }, 2000);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      
      // Increment consecutive errors count
      setConsecutiveErrors(prev => prev + 1);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add fallback response
      const fallbackMessage: Message = {
        text: consecutiveErrors > 1 
          ? "I'm experiencing persistent connectivity issues. Let me switch to offline mode to help you better."
          : "I seem to be having connectivity issues. Let me try to help based on what I already know...",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      // Add typing indicator for second fallback
      setMessages(prev => [...prev, {
        text: "",
        sender: 'ai',
        timestamp: new Date(),
        isTyping: true
      }]);
      
      // Generate a more detailed fallback response
      setTimeout(() => {
        // Remove typing indicator
        setMessages(prev => prev.filter(msg => !msg.isTyping));
        
        const fallbackResponse = generateDetailedResponse(message);
        const secondFallbackMessage: Message = {
          text: fallbackResponse,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, secondFallbackMessage]);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate detailed fallback responses based on common shopping-related queries
  const generateDetailedResponse = (query: string): string => {
    query = query.toLowerCase();
    
    // Product pricing and deals
    if (query.includes('best deal') || query.includes('cheapest') || query.includes('price')) {
      return "Based on my latest information, the best deals are usually found by comparing prices across multiple stores like Amazon, Best Buy, and Walmart. I recommend using our price comparison tool at the top of this page to find the best current prices for specific products.\n\nPrice tracking tools like CamelCamelCamel for Amazon can also help you see if the current price is actually a good deal compared to historical prices. Major shopping events like Black Friday, Cyber Monday, Amazon Prime Day, and back-to-school sales often offer the deepest discounts.";
    } 
    
    // Product-specific queries
    if (query.includes('iphone') || query.includes('apple')) {
      return "Apple products like iPhones tend to have similar pricing across retailers, but you can often find deals at authorized resellers like Best Buy or during special sales events. The latest iPhone models typically range from $699 to $1,099 depending on the specific model and storage capacity.\n\nApple rarely offers direct discounts, but they do have education pricing, trade-in programs, and occasional gift card promotions. Refurbished iPhones directly from Apple also offer good value with full warranties. For accessories, third-party retailers often have better prices than Apple's own store.";
    }
    
    if (query.includes('laptop') || query.includes('computer')) {
      return "When shopping for laptops, I recommend focusing on your specific needs rather than just price. For productivity and everyday use, look for at least 8GB RAM and an SSD. For gaming or content creation, prioritize a better GPU and at least 16GB RAM.\n\nGood deals can be found at retailers like Dell, HP, Lenovo, and Best Buy. For the best value, consider last year's models or watch for back-to-school sales. Budget laptops range from $300-$600, mid-range from $600-$1000, and premium/gaming models from $1000-$2000+. Don't forget to check manufacturer outlet stores for refurbished models with warranties.";
    }
    
    if (query.includes('tv') || query.includes('television')) {
      return "When shopping for TVs, consider screen size (based on viewing distance), resolution (4K is standard now), and panel type (OLED for best quality, QLED/LED for brightness and value).\n\nThe best TV deals typically appear during Black Friday, Super Bowl season, and when new models are released (usually spring). Mid-range 55\" 4K TVs typically cost $400-$700, while premium OLED models start around $1,200. Retailers like Best Buy, Amazon, Walmart, and Costco often have competitive pricing and price-matching policies. Use our comparison tool to find the best current deals across these retailers.";
    }
    
    // Shopping strategies
    if (query.includes('discount') || query.includes('coupon') || query.includes('promo')) {
      return "To find the best discounts and coupons:\n\n1. Use browser extensions like Honey, Rakuten, or Capital One Shopping to automatically apply coupons\n2. Sign up for retailer newsletters to get first-time purchase discounts and sale alerts\n3. Check cashback sites like Rakuten, TopCashback, or your credit card's shopping portal\n4. Time your purchases during major sales events (Black Friday, Cyber Monday, Prime Day)\n5. Look for open-box or display models at retailers like Best Buy for additional discounts\n\nMany retailers also offer price matching, so it's worth asking customer service if you find a better price elsewhere.";
    }
    
    if (query.includes('review') || query.includes('rating') || query.includes('best quality')) {
      return "When evaluating product reviews, look at both the average rating and the distribution of reviews. A product with 4.3 stars based on 10,000 reviews is usually more reliable than one with 5 stars from just 10 reviews.\n\nPay special attention to reviews that mention durability and long-term use. For expert opinions, check sites like Consumer Reports, RTINGS.com, Wirecutter, and CNET, which conduct thorough testing. Our price comparison tool includes retailer ratings to help you make informed decisions about where to buy, in addition to product pricing information.";
    }
    
    if (query.includes('warranty') || query.includes('return') || query.includes('exchange')) {
      return "Return policies and warranty coverage vary significantly between retailers:\n\n- Amazon typically offers 30-day returns for most items\n- Best Buy provides 15-day returns (30 days for their members)\n- Walmart has a 90-day return policy for most products\n- Costco has one of the most generous return policies with no time limit on many items\n\nFor electronics, consider extended warranty options for high-value items, but check your credit card benefits first as many offer extended warranty protection automatically. Always keep your receipts and original packaging to facilitate smooth returns or warranty claims.";
    }
    
    if (query.includes('shipping') || query.includes('delivery')) {
      return "Shipping policies vary by retailer. Amazon offers free 2-day shipping for Prime members ($139/year). Walmart+ members ($98/year) get free next-day and two-day shipping with no minimum. Best Buy provides free shipping on orders over $35, while Target offers free 2-day shipping for RedCard holders or on orders over $35.\n\nDuring holiday seasons, many retailers offer free or expedited shipping promotions. If you need an item urgently, check if the retailer offers same-day pickup at a local store, which is often free and faster than delivery.";
    }
    
    // Trust and security
    if (query.includes('safe') || query.includes('secure') || query.includes('trust') || query.includes('scam')) {
      return "When shopping online, always ensure:\n\n1. The website has a secure connection (https:// in the URL)\n2. The retailer has clear contact information and a proper return policy\n3. You're using a credit card (not debit) for better fraud protection\n4. The deal isn't suspiciously low compared to other retailers\n\nStick to established retailers when possible. For marketplace sellers on sites like Amazon or eBay, check their ratings and review history. Our comparison tool focuses on legitimate retailers to help you find the best prices safely. If a deal seems too good to be true, it probably is.";
    }
    
    // Default comprehensive fallback
    return "I'd be happy to help you find the best prices and shopping information. You can use our price comparison tool at the top of the page to search for specific products by name, URL, or even by scanning a barcode.\n\nI can also answer questions about:\n- Finding the best deals and discounts\n- Comparing products and features\n- Understanding retailer policies\n- Shopping securely online\n- Recommendations based on your needs\n\nJust let me know what you're looking for, and I'll do my best to assist you!";
  };

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat bubble button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full p-4 w-16 h-16 shadow-lg bg-primary text-white hover:bg-primary/90 animate-pulse"
        >
          <MessageCircle size={28} />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="bg-card border rounded-lg shadow-xl w-80 md:w-96 flex flex-col h-[500px] max-h-[80vh]">
          {/* Chat header */}
          <div className="p-4 border-b bg-primary text-primary-foreground flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">AI Shopping Assistant</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary/90"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.isTyping ? 'bg-muted animate-pulse' : 'bg-muted'
                  }`}
                >
                  {msg.isTyping ? (
                    <div className="flex items-center justify-center space-x-1 h-6">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about products or prices..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit"
              size="icon"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
