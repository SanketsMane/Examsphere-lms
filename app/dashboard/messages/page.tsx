"use client";

import { useSearchParams } from "next/navigation";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  Paperclip,
  Image,
  MoreVertical
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
// Removed server action imports - using API routes instead
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { toast } from "sonner";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  teacherProfile?: {
    bio: string | null;
    expertise: string[];
  } | null;
};

type Message = {
  id: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  replies?: Message[];
};

type Conversation = {
  id: string;
  title: string | null;
  lastActivity: string;
  otherParticipant: {
    id: string;
    name: string;
    image: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
      image: string | null;
    };
  } | null;
  unreadCount: number;
};

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper ref for typing debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isConnected,
    sendChatMessage,
    setOnMessageReceived,
    onlineUsers,
    typingUsers,
    sendTypingStart,
    sendTypingStop
  } = useChatWebSocket();

  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("id");

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Effect to select conversation from URL or create new one
  useEffect(() => {
    const createChatWith = searchParams.get("createChatWith");
    
    if (createChatWith && !selectedConversation) {
      // Check if we already have a conversation with this user
      const existingConv = conversations.find(c => c.otherParticipant.id === createChatWith);
      
      if (existingConv) {
        setSelectedConversation(existingConv.id);
      } else {
        // Create new conversation
        handleStartConversation(createChatWith);
      }
      
      // Clear the query param to avoid re-triggering
      const url = new URL(window.location.href);
      url.searchParams.delete("createChatWith");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    if (conversationIdParam && !selectedConversation && conversations.length > 0) {
      // Verify if it exists in loaded conversations or just set it (will load messages anyway)
      // To be safe, we check if we have it or if we should trust the URL.
      // Loading messages handles fetch by ID, so setting it is safe if valid.
      const exists = conversations.find(c => c.id === conversationIdParam);
      if (exists) {
        setSelectedConversation(conversationIdParam);
      }
    }
  }, [conversationIdParam, conversations, selectedConversation, searchParams]);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      const convs = await response.json();
      setConversations(convs);

      // Default to URL param if present, else first
      if (conversationIdParam) {
        setSelectedConversation(conversationIdParam);
      } else if (convs.length > 0 && !selectedConversation) {
        setSelectedConversation(convs[0].id);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations?conversationId=${conversationId}`);
      const msgs = await response.json();
      setMessages(msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!selectedConversation || !currentConversation) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send 'start typing' if not already handled (or just send every keypress logic can be refined)
    // Simple logic: Send start, wait 2s, send stop.
    // Ideally we debounce the STOP, but throttling the START is also good.
    // For simplicity: Send START immediately if we haven't recently. 
    // Actually, just sending START is fine, the receiver UI just needs "is currently in map".
    // Better: Send START. Debounce STOP.

    sendTypingStart(currentConversation.otherParticipant.id, selectedConversation);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(currentConversation.otherParticipant.id, selectedConversation);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    // Clear typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (currentConversation) sendTypingStop(currentConversation.otherParticipant.id, selectedConversation);

    setSendingMessage(true);
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendMessage", conversationId: selectedConversation, message: newMessage.trim() })
      });

      const newMsg = await response.json();

      // Send real-time update
      if (isConnected && currentConversation) {
        sendChatMessage(currentConversation.otherParticipant.id, newMessage.trim(), selectedConversation, newMsg.id);
      }

      setNewMessage("");
      await loadMessages(selectedConversation);
      await loadConversations(); // Refresh conversations to update last message
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "searchUsers", query })
      });
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createConversation", userId })
      });
      const conversation = await response.json();
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
      setSelectedConversation(conversation.id);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  // Check typing status for current conversation
  const isTyperTyping = selectedConversation && currentConversation
    ? typingUsers[selectedConversation]?.includes(currentConversation.otherParticipant.id)
    : false;

  if (loading) {
    return (
      <div className="h-full flex">
        <div className="w-1/3 border-r">
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <Card
                          key={user.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleStartConversation(user.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={constructS3Url(user.image || "")} />
                                <AvatarFallback>
                                  {user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                {user.teacherProfile && (
                                  <p className="text-xs text-blue-600">Teacher</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {searchQuery.length >= 2 && searchResults.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No users found
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground">Start a new chat to begin messaging</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors ${selectedConversation === conversation.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                      }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={constructS3Url(conversation.otherParticipant.image || "")} />
                            <AvatarFallback>
                              {conversation.otherParticipant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {onlineUsers.has(conversation.otherParticipant.id) && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {conversation.otherParticipant.name}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate">
                                {typingUsers[conversation.id]?.includes(conversation.otherParticipant.id)
                                  ? <span className="text-primary animate-pulse">Typing...</span>
                                  : conversation.lastMessage.content
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={constructS3Url(currentConversation.otherParticipant.image || "")} />
                    <AvatarFallback>
                      {currentConversation.otherParticipant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {onlineUsers.has(currentConversation.otherParticipant.id) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{currentConversation.otherParticipant.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {onlineUsers.has(currentConversation.otherParticipant.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isOwn = message.sender.id === currentConversation.otherParticipant.id ? false : true;
                  const showAvatar = index === messages.length - 1 ||
                    messages[index + 1]?.sender.id !== message.sender.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showAvatar ? "mb-4" : "mb-1"
                        }`}
                    >
                      <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-[70%]`}>
                        {showAvatar && !isOwn && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={constructS3Url(message.sender.image || "")} />
                            <AvatarFallback className="text-xs">
                              {message.sender.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 ${isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {showAvatar && !isOwn && <div className="w-6" />}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator inside Chat Bubble */}
                {isTyperTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex flex-row items-end space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={constructS3Url(currentConversation.otherParticipant.image || "")} />
                        <AvatarFallback className="text-xs">
                          {currentConversation.otherParticipant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => handleTyping(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sendingMessage}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={sendingMessage}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={sendingMessage}
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Welcome to Messages</h3>
              <p className="text-muted-foreground mb-6">
                Select a conversation to start messaging, or create a new one.
              </p>
              <Button onClick={() => setIsSearchOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}