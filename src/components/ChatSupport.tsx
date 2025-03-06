
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Zap, ChevronDown, ChevronUp, ShoppingBag, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens for the first time
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm your AI shopping assistant. I can help you find the best deals, compare prices, and answer questions about products. How can I help you today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);
    
    try {
      // Format previous messages for context
      const previousMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Append current user message
      previousMessages.push({
        role: 'user',
        content: message
      });
      
      const response = await FirecrawlService.askGeminiAI(message, previousMessages);
      
      if (response.success) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        toast({
          title: "Error",
          description: "Failed to get a response. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Card className="w-80 sm:w-96 shadow-lg border-primary/20">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between bg-muted/50">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2 bg-primary">
                    <Zap className="h-4 w-4 text-primary-foreground" />
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">Shopping Assistant</CardTitle>
                    <CardDescription className="text-xs">Ask me about products & deals</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleChat}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <ScrollArea className="h-72 px-4 py-2">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                        <div className="flex space-x-1">
                          <span className="animate-bounce">•</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
                          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>•</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              <CardFooter className="p-3 pt-2 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Ask about products, deals, or shopping advice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-full bg-muted"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!message.trim() || isTyping}
                    className="rounded-full h-8 w-8 flex-shrink-0 bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
              
              <div className="flex justify-center p-2 border-t text-xs text-muted-foreground">
                <div className="flex gap-2 justify-center">
                  <Badge variant="outline" className="text-[10px] h-5 hover:bg-muted cursor-pointer" onClick={() => {
                    setMessage("What's a good price for a laptop?");
                    if (inputRef.current) inputRef.current.focus();
                  }}>
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Pricing help
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-5 hover:bg-muted cursor-pointer" onClick={() => {
                    setMessage("How can I find the best deals?");
                    if (inputRef.current) inputRef.current.focus();
                  }}>
                    <Search className="h-3 w-3 mr-1" />
                    Finding deals
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={toggleChat}
        className={`rounded-full shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            <span>Chat Support</span>
          </div>
        )}
      </Button>
    </div>
  );
};
