
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
      text: "...",
      sender: 'ai',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, typingIndicator]);
    
    try {
      // Send message to AI with 5-second timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const responsePromise = FirecrawlService.askGeminiAI(message);
      
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.text !== "..."));
      
      // Add AI response to chat
      const aiMessage: Message = {
        text: response.success 
          ? response.message 
          : "I'm having trouble connecting to my knowledge base right now. Let me try a different approach...",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If the first approach failed, try a fallback approach (simulated response)
      if (!response.success) {
        setTimeout(() => {
          const fallbackResponse = generateFallbackResponse(message);
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
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.text !== "..."));
      
      // Add fallback response
      const fallbackMessage: Message = {
        text: "I seem to be having connectivity issues. Let me try to help based on what I already know...",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      // Generate a fallback response
      setTimeout(() => {
        const fallbackResponse = generateFallbackResponse(message);
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

  // Generate fallback responses based on common shopping-related queries
  const generateFallbackResponse = (query: string): string => {
    query = query.toLowerCase();
    
    if (query.includes('best deal') || query.includes('cheapest')) {
      return "Based on my latest information, the best deals are usually found by comparing prices across multiple stores like Amazon, Best Buy, and Walmart. I recommend using our price comparison tool at the top of this page to find the best current prices.";
    } 
    
    if (query.includes('iphone') || query.includes('apple')) {
      return "Apple products like iPhones tend to have similar pricing across retailers, but you can often find deals at authorized resellers like Best Buy or during special sales events. The latest models typically range from $699 to $1099 depending on the specific model and storage capacity.";
    }
    
    if (query.includes('laptop') || query.includes('computer')) {
      return "When shopping for laptops, I recommend focusing on your specific needs (gaming, work, casual use) rather than just price. Good deals can be found at retailers like Dell, HP, Lenovo, and Best Buy. For the best value, consider last year's models or watch for back-to-school sales.";
    }
    
    if (query.includes('discount') || query.includes('coupon') || query.includes('promo')) {
      return "To find discounts and coupons, I recommend checking retailer newsletters, browser extensions like Honey or Rakuten, and timing your purchases during major sales events like Black Friday, Cyber Monday, or Amazon Prime Day.";
    }
    
    if (query.includes('review') || query.includes('rating')) {
      return "When evaluating product reviews, look at both the average rating and the distribution of reviews. Pay special attention to reviews that mention durability and long-term use. Our price comparison tool includes retailer ratings to help you make informed decisions.";
    }
    
    // Default fallback response
    return "I'd be happy to help you find the best prices and shopping information. You can use our price comparison tool at the top of the page to search for specific products, or ask me about shopping strategies, current deals, or product recommendations.";
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
                      : msg.text === "..." ? 'bg-muted animate-pulse' : 'bg-muted'
                  }`}
                >
                  {msg.text === "..." ? (
                    <div className="flex items-center justify-center space-x-1 h-6">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{msg.text}</p>
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
