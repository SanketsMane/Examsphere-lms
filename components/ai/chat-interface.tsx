"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Plus, MessageSquare, Menu, Paperclip, X, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
        // Use a small timeout to ensure DOM update
        setTimeout(() => {
             scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages, isLoading]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch conversations", error);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/ai/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentConversationId(data.id);
        setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        setIsSidebarOpen(false); // Close mobile sidebar
      }
    } catch (error) {
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setAttachments([]);
    setIsSidebarOpen(false);
  };

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== id));
        if (currentConversationId === id) {
          createNewChat();
        }
        toast.success("Conversation deleted");
      }
    } catch (error) {
      toast.error("Failed to delete conversation");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Helper to read file content (Mock upload behavior)
  const readFileContent = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.readAsText(file); // Assume text for now as we pass content to LLM
      });
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    let messageContent = input;
    const attachmentNames: string[] = [];

    // Process attachments (Append content to prompt for context)
    // This is a simple implementation. Ideally, we upload to S3 and pass URL.
    // For this environment, passing text content directly.
    if (attachments.length > 0) {
         for (const file of attachments) {
             attachmentNames.push(file.name);
             if (file.type.startsWith('text/') || file.name.endsWith('.ts') || file.name.endsWith('.js') || file.name.endsWith('.md')) {
                 const content = await readFileContent(file);
                 messageContent += `\n\n--- FILE: ${file.name} ---\n${content}\n--- END FILE ---`;
             } else {
                 messageContent += `\n\n[Attached File: ${file.name} - (Content parsing skipped for binary type)]`;
             }
         }
    }

    const userMessage: Message = { role: "user", content: messageContent };
    
    // Optimistic UI
    // If it's a new chat, we might want to create ID first, but let's handle it in backend or creating blindly
    // Actually, backend creates message. If no ID, backend won't persist unless we create convo first.
    // Let's create convo if null
    let conversationId = currentConversationId;
    
    if (!conversationId) {
        try {
            const res = await fetch("/api/ai/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: input.trim().substring(0, 40) || "New Chat" })
            });
            if (res.ok) {
                const newConvo = await res.json();
                conversationId = newConvo.id;
                setCurrentConversationId(newConvo.id);
                setConversations(prev => [newConvo, ...prev]);
            } else {
                console.error("Failed to create conversation:", await res.text());
                // Fallback: Continue without persistence if creation fails
            }
        } catch (e) {
            console.error("Conversation creation error:", e);
        }
    }

    setMessages((prev) => [...prev, { role: "user", content: input + (attachmentNames.length ? `\n[Attached: ${attachmentNames.join(", ")}]` : "") }]); // Show clean input in UI
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            messages: [...messages, userMessage], // Include full history + new message
            conversationId,
            attachments: attachmentNames // Just meta for now
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const aiMessage: Message = { role: "assistant", content: data.content };
      
      setMessages((prev) => [...prev, aiMessage]);
      fetchConversations(); // Refresh list to update times/titles if changed
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sidebar Component
  const SidebarList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
         <Button onClick={createNewChat} className="w-full justify-start gap-2" variant="outline">
            <Plus className="w-4 h-4" /> New Chat
         </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
           {conversations.map(chat => (
               <div 
                key={chat.id} 
                onClick={() => loadConversation(chat.id)}
                className={cn(
                    "flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm mb-1 group transition-colors",
                    currentConversationId === chat.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                )}
               >
                  <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate max-w-[140px]">{chat.title}</span>
                  </div>
                  <Button
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => deleteConversation(e, chat.id)}
                  >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
               </div>
           ))}
           {conversations.length === 0 && (
               <div className="text-center py-8 text-muted-foreground text-xs">
                   No past conversations
               </div>
           )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r bg-muted/10 shrink-0">
         <SidebarList />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header / Title */}
        <div className="border-b p-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
                 <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                     <SheetTrigger asChild>
                         <Button variant="ghost" size="icon" className="md:hidden">
                             <Menu className="w-5 h-5" />
                         </Button>
                     </SheetTrigger>
                     <SheetContent side="left" className="p-0 w-64">
                         <SidebarList />
                     </SheetContent>
                 </Sheet>
                 <div className="flex items-center gap-2">
                     <span className="font-semibold">Kidokool Ai</span>
                     <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-medium">
                         qwen2.5:14b
                     </span>
                 </div>
            </div>
            
            <div className="flex items-center gap-2">
                 {/* Right side actions if needed */}
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full px-4" ref={scrollRef}>
                <div className="max-w-3xl mx-auto py-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">How can I help you today?</h2>
                        </div>
                    )}
                    
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
                            {message.role === "assistant" && (
                                <Avatar className="w-8 h-8 mt-1 border">
                                    <AvatarFallback className="bg-primary/5"><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                                </Avatar>
                            )}
                            
                            <div className={cn(
                                "max-w-[85%] rounded-2xl px-5 py-3 text-sm",
                                message.role === "user" 
                                    ? "bg-primary text-primary-foreground" 
                                    : "bg-muted/50 border"
                            )}>
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {message.role === "user" && (
                                <Avatar className="w-8 h-8 mt-1 border">
                                    <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex gap-4">
                            <Avatar className="w-8 h-8 mt-1 border">
                                <AvatarFallback className="bg-primary/5"><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                            </Avatar>
                            <div className="bg-muted/50 border rounded-2xl px-5 py-3 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div className="h-4" /> {/* Spacer */}
                </div>
            </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t">
            <div className="max-w-3xl mx-auto">
                {attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-xs border">
                                <FileText className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[100px]">{file.name}</span>
                                <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="relative flex items-center gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                        multiple 
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="rounded-full shrink-0" 
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Attach files</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        placeholder="Message Kidokool Ai..."
                        className="flex-1 rounded-full py-6 px-6 shadow-sm"
                        disabled={isLoading}
                    />
                    
                    <Button 
                        size="icon" 
                        className="rounded-full shrink-0" 
                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                        onClick={handleSendMessage}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-muted-foreground">Kidokool Ai can make mistakes. Check important info.</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
