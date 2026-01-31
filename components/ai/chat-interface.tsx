"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from Kidokool Ai");
      }

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.content };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto w-full bg-background border rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Kidokool Ai</h2>
            <p className="text-xs text-muted-foreground mt-1 text-green-500 font-medium flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online & Ready to help
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat} title="Clear Chat">
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-70">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Welcome to Kidokool Ai</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                I'm your dedicated language learning assistant. Ask me anything about lessons, teaching tips, or platform orientation.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                <button onClick={() => setInput("How can I improve my English fluency?")} className="text-sm p-3 bg-muted rounded-xl hover:bg-muted/80 text-left border border-transparent hover:border-primary/20 transition-all">
                  How can I improve my English fluency?
                </button>
                <button onClick={() => setInput("Explain how to use the Kidokool dashboard.")} className="text-sm p-3 bg-muted rounded-xl hover:bg-muted/80 text-left border border-transparent hover:border-primary/20 transition-all">
                  Explain how to use the dashboard
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-4 group animate-in fade-in duration-300",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <Avatar className={cn(
                "size-8 shrink-0",
                message.role === "user" ? "order-2" : "order-1"
              )}>
                {message.role === "assistant" ? (
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="size-5" />
                  </AvatarFallback>
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="size-5" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div className={cn(
                "flex flex-col max-w-[80%] gap-2",
                message.role === "user" ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted rounded-tl-none border"
                )}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-50 px-1">
                  {message.role === "assistant" ? "Kidokool Ai" : "You"}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 animate-in fade-in duration-300">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-none border px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Kidokool Ai is thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message here..."
            className="flex-1 bg-background border-muted h-12 rounded-xl focus-visible:ring-primary shadow-sm"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 rounded-xl shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center p-0"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-medium opacity-50">
          Powered by Kidokool Intelligence
        </p>
      </div>
    </div>
  );
}
