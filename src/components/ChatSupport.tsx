import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, X, MessageCircle, Loader2, HistoryIcon } from "lucide-react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [persistentChats, setPersistentChats] = useState<Message[][]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeChatIndex, setActiveChatIndex] = useState(0);

  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('shopping_assistant_chats');
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats) as { messages: Message[], chatHistory: string[] }[];
        if (parsedChats.length > 0) {
          const formattedChats = parsedChats.map(chat => {
            return chat.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          });
          setPersistentChats(formattedChats);
          
          setMessages(formattedChats[0]);
          setChatHistory(parsedChats[0].chatHistory || []);
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      try {
        const updatedPersistentChats = [...persistentChats];
        
        if (activeChatIndex < updatedPersistentChats.length) {
          updatedPersistentChats[activeChatIndex] = messages;
        } else {
          updatedPersistentChats.unshift(messages);
          setActiveChatIndex(0);
        }
        
        const trimmedChats = updatedPersistentChats.slice(0, 10);
        setPersistentChats(trimmedChats);
        
        const formattedChats = trimmedChats.map((chat, index) => ({
          messages: chat,
          chatHistory: index === activeChatIndex ? chatHistory : []
        }));
        
        localStorage.setItem('shopping_assistant_chats', JSON.stringify(formattedChats));
      } catch (error) {
        console.error("Error saving chat history:", error);
      }
    }
  }, [messages, chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage: Message = {
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    const updatedHistory = [...chatHistory, message];
    setChatHistory(updatedHistory);
    
    setMessage("");
    setIsLoading(true);
    
    const typingIndicator: Message = {
      text: "",
      sender: 'ai',
      timestamp: new Date(),
      isTyping: true
    };
    
    setMessages(prev => [...prev, typingIndicator]);
    
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 12000);
      });
      
      const contextString = updatedHistory.slice(-5).join(" | ");
      
      const responsePromise = FirecrawlService.askGeminiAI(contextString);
      
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;
      
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      const aiMessage: Message = {
        text: response.success 
          ? response.message 
          : "I'm having trouble connecting to my knowledge base right now. Let me try a different approach...",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      setConsecutiveErrors(0);
      
      if (!response.success) {
        setMessages(prev => [...prev, {
          text: "",
          sender: 'ai',
          timestamp: new Date(),
          isTyping: true
        }]);
        
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => !msg.isTyping));
          
          const fallbackResponse = getResponseBasedOnKeywords(message);
          const fallbackMessage: Message = {
            text: fallbackResponse,
            sender: 'ai',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }, 1500);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      
      setConsecutiveErrors(prev => prev + 1);
      
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      const fallbackMessage: Message = {
        text: consecutiveErrors > 1 
          ? "I'm experiencing persistent connectivity issues. Let me switch to offline mode to help you better."
          : "I seem to be having connectivity issues. Let me try to help based on what I already know...",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      setMessages(prev => [...prev, {
        text: "",
        sender: 'ai',
        timestamp: new Date(),
        isTyping: true
      }]);
      
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => !msg.isTyping));
        
        const fallbackResponse = getResponseBasedOnKeywords(message);
        const secondFallbackMessage: Message = {
          text: fallbackResponse,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, secondFallbackMessage]);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    const welcomeMessage: Message = {
      text: "Hi there! I'm your AI shopping assistant. How can I help you find the best deals today?",
      sender: 'ai',
      timestamp: new Date()
    };
    
    const updatedChats = [[welcomeMessage], ...persistentChats];
    setPersistentChats(updatedChats);
    
    setMessages([welcomeMessage]);
    setChatHistory([]);
    setActiveChatIndex(0);
    setShowHistory(false);
  };

  const selectChat = (index: number) => {
    if (index < persistentChats.length) {
      setMessages(persistentChats[index]);
      setActiveChatIndex(index);
      setShowHistory(false);
      
      try {
        const savedChats = localStorage.getItem('shopping_assistant_chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats) as { messages: Message[], chatHistory: string[] }[];
          if (parsedChats[index] && parsedChats[index].chatHistory) {
            setChatHistory(parsedChats[index].chatHistory || []);
          } else {
            setChatHistory([]);
          }
        }
      } catch (error) {
        console.error("Error loading chat history for selected chat:", error);
        setChatHistory([]);
      }
    }
  };

  const deleteChat = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedChats = [...persistentChats];
    updatedChats.splice(index, 1);
    setPersistentChats(updatedChats);
    
    if (index === activeChatIndex) {
      if (updatedChats.length > 0) {
        setMessages(updatedChats[0]);
        setActiveChatIndex(0);
      } else {
        startNewChat();
      }
    } else if (index < activeChatIndex) {
      setActiveChatIndex(activeChatIndex - 1);
    }
    
    try {
      const formattedChats = updatedChats.map(chat => ({
        messages: chat,
        chatHistory: []
      }));
      localStorage.setItem('shopping_assistant_chats', JSON.stringify(formattedChats));
    } catch (error) {
      console.error("Error saving chat history after deletion:", error);
    }
  };

  const getResponseBasedOnKeywords = (query: string): string => {
    query = query.toLowerCase();
    
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      return "Hello there! I'm happy to help with your shopping needs today. What are you looking for?";
    }
    
    if (query.includes('thank')) {
      return "You're welcome! I'm always here to help with your shopping questions.";
    }
    
    if (query.includes('trust') || query.includes('reliable')) {
      return "Our price comparisons are based on real-time data from major retailers. While we strive for accuracy, prices can change quickly, so we recommend checking the retailer's site for final pricing. We also include vendor ratings to help you identify trustworthy sellers.";
    }
    
    if (query.includes('best deal') || query.includes('cheapest') || query.includes('price')) {
      return "To find the best deals, I recommend using our price comparison tool to check prices across multiple retailers. The tool shows you which store has the lowest price and any available discounts. Many stores also offer price matching, so it's worth asking if you find a better deal elsewhere.";
    } 
    
    if (query.includes('iphone') || query.includes('apple')) {
      return "When shopping for Apple products like iPhones, prices are generally consistent across retailers, but authorized resellers like Best Buy sometimes offer better deals than Apple directly. Look for carrier promotions if you need a plan, or consider Apple's refurbished store for discounted devices with full warranties.";
    }
    
    if (query.includes('laptop') || query.includes('computer')) {
      return "When shopping for laptops, consider your specific needs. For basic browsing and documents, an entry-level model ($300-500) will suffice. For photo/video editing or gaming, look for models with dedicated graphics cards ($800+). The best laptop deals typically appear during back-to-school sales (July-August) and Black Friday.";
    }
    
    if (query.includes('tv') || query.includes('television')) {
      return "TV shopping tips: Measure your space first to determine the right size. For most living rooms, 55-65 inches is ideal. OLED displays offer the best picture quality but cost more, while LED/LCD TVs provide good value. For gaming or sports, look for higher refresh rates (120Hz+). Super Bowl season and Black Friday typically offer the best TV deals.";
    }
    
    if (query.includes('discount') || query.includes('coupon') || query.includes('promo')) {
      return "To maximize your savings: 1) Use browser extensions like Honey or Rakuten to automatically find coupons and earn cashback, 2) Sign up for retailer newsletters to get first-purchase discounts, 3) Time purchases during major sales events like Prime Day or Black Friday, 4) Check if your credit card offers shopping portals with additional rewards.";
    }
    
    if (query.includes('shipping') || query.includes('delivery')) {
      return "Shipping policies vary by retailer. Amazon offers free 2-day shipping for Prime members, Walmart provides free shipping on orders over $35, and Best Buy offers free shipping on most orders over $35. Many retailers also offer free in-store pickup if you need items quickly without paying for expedited shipping.";
    }
    
    if (query.includes('review') || query.includes('rating')) {
      return "When evaluating product reviews, look for verified purchases and detailed feedback. The distribution of ratings matters more than the average—a product with mostly 5-star and 1-star reviews may have quality control issues. For tech products, professional reviews from sites like RTINGS, Wirecutter, or Consumer Reports can provide more objective assessments.";
    }
    
    if (query.includes('history') || query.includes('past searches') || query.includes('previous')) {
      return "You can access your search history at the top of the search form. It shows your recent product searches and the best prices you found. Click on any item in your history to quickly re-run that search with updated pricing information.";
    }
    
    return "I can help you find the best prices for products, compare features, and suggest shopping strategies. For specific product searches, try using our price comparison tool at the top of the page. Is there a particular product category you're interested in?";
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getChatPreview = (chat: Message[]) => {
    const lastUserMsg = [...chat].reverse().find(msg => msg.sender === 'user');
    if (lastUserMsg) {
      return lastUserMsg.text.length > 25 
        ? lastUserMsg.text.substring(0, 25) + '...' 
        : lastUserMsg.text;
    }
    
    const firstAiMsg = chat.find(msg => msg.sender === 'ai');
    if (firstAiMsg) {
      return firstAiMsg.text.length > 25 
        ? firstAiMsg.text.substring(0, 25) + '...' 
        : firstAiMsg.text;
    }
    
    return "New conversation";
  };
  
  const getChatDate = (chat: Message[]) => {
    if (chat.length > 0) {
      const firstMessage = chat[0];
      return firstMessage.timestamp.toLocaleDateString();
    }
    return "Today";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full p-4 w-16 h-16 shadow-lg bg-primary text-white hover:bg-primary/90 animate-pulse"
        >
          <MessageCircle size={28} />
        </Button>
      )}

      {isOpen && (
        <div className="bg-card border rounded-lg shadow-xl w-80 md:w-96 flex flex-col h-[500px] max-h-[80vh]">
          <div className="p-4 border-b bg-primary text-primary-foreground flex justify-between items-center rounded-t-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">AI Shopping Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowHistory(!showHistory)}
                className="text-primary-foreground hover:bg-primary/90"
              >
                <HistoryIcon className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/90"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="flex justify-between items-center mb-3 px-2">
                <h4 className="text-sm font-medium">Chat History</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={startNewChat}
                  className="text-xs px-2 py-1 h-8"
                >
                  New Chat
                </Button>
              </div>
              
              {persistentChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No chat history yet
                </div>
              ) : (
                <div className="space-y-2">
                  {persistentChats.map((chat, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg cursor-pointer ${
                        index === activeChatIndex 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => selectChat(index)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">
                            {getChatPreview(chat)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <span>{getChatDate(chat)}</span>
                            <span>•</span>
                            <span>{chat.length} messages</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          onClick={(e) => deleteChat(index, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
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
                            {formatTime(msg.timestamp)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {!showHistory && (
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
          )}
        </div>
      )}
    </div>
  );
};
