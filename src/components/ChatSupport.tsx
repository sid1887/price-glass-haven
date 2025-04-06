import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Sparkles, Bot, User, Info } from "lucide-react";
import { FirecrawlService } from "@/utils/FirecrawlService";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function ChatSupport() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: "assistant",
      content: "Hello! I'm your shopping assistant. Ask me anything about products, prices, or shopping tips.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Convert messages to the format expected by FirecrawlService
      const previousMessages = messages
        .slice(-5) // Only send the last 5 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Push the current user message to the context
      previousMessages.push({
        role: "user",
        content: input
      });
      
      // Pass the formatted messages directly as context (not as a string)
      const response = await FirecrawlService.askGeminiAI(input, 'shopping', previousMessages);
      
      if (response.success && response.message) {
        const botMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: response.message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.error || "Failed to get a response");
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Sorry, I couldn't process your request right now. Please try again later.",
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I couldn't process your request right now. Please try again later.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          Shopping Assistant
        </CardTitle>
        <CardDescription>Ask me anything about products, prices, or shopping tips</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-[320px] px-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === "user" ? "You" : "Shopping Assistant"}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 text-right mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0">
        <div className="flex w-full items-center space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
