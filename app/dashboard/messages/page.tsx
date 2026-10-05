"use client";

import { useSearchParams } from "next/navigation";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Search,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import { useAuth } from "@/lib/auth-client";
import { toast } from "sonner";
import { constructS3Url } from "@/lib/s3-helper";

export const dynamic = "force-dynamic";

type User = {
  id: string;
  name: string;
  image: string | null;
  teacherProfile?: {
    bio: string | null;
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
  isGroup: boolean;
  lastActivity: string;
  // null for group chats; use displayName/displayImage for rendering
  otherParticipant: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  displayName: string;
  displayImage: string | null;
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

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function initial(name?: string | null) {
  return (name || "?").charAt(0).toUpperCase();
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  // On small screens only one pane is visible at a time
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: session } = useAuth();
  const currentUserId = session?.user?.id;

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

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      if (!response.ok) {
        toast.error(await readError(response, "Could not load conversations"));
        return;
      }
      const convs = await response.json();
      const list: Conversation[] = Array.isArray(convs) ? convs : [];
      setConversations(list);

      setSelectedConversation((prev) => {
        if (prev) return prev;
        if (conversationIdParam && list.some((c) => c.id === conversationIdParam)) {
          return conversationIdParam;
        }
        return list[0]?.id ?? null;
      });
    } catch {
      toast.error("Could not load conversations");
    } finally {
      setLoading(false);
    }
  }, [conversationIdParam]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations?conversationId=${encodeURIComponent(conversationId)}`);
      if (!response.ok) {
        toast.error(await readError(response, "Could not load messages"));
        return;
      }
      const msgs = await response.json();
      // Ignore responses for a conversation the user has already navigated away from
      if (selectedRef.current === conversationId) {
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch {
      toast.error("Could not load messages");
    }
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", conversationId })
      });
      if (response.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch {
      // Non-critical: the unread badge simply stays until the next refresh
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    selectedRef.current = selectedConversation;
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    setMessages([]);
    setMessagesLoading(true);
    loadMessages(selectedConversation).finally(() => setMessagesLoading(false));
    markAsRead(selectedConversation);
  }, [selectedConversation, loadMessages, markAsRead]);

  useEffect(() => {
    setOnMessageReceived((payload: any) => {
      const convId = payload?.conversationId;
      if (convId && convId === selectedRef.current) {
        loadMessages(convId);
        markAsRead(convId);
      }
      loadConversations();
    });
  }, [setOnMessageReceived, loadMessages, markAsRead, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select conversation from ?createChatWith=<userId> (e.g. "Message Teacher" buttons)
  useEffect(() => {
    const createChatWith = searchParams.get("createChatWith");
    if (!createChatWith || loading) return;

    const existingConv = conversations.find(c => c.otherParticipant?.id === createChatWith);
    if (existingConv) {
      openConversation(existingConv.id);
    } else {
      handleStartConversation(createChatWith);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("createChatWith");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading]);

  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const peerId = currentConversation?.otherParticipant?.id;

  const openConversation = (id: string) => {
    setSelectedConversation(id);
    setMobileView("thread");
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Typing indicators are 1:1 only
    if (!selectedConversation || !peerId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingStart(peerId, selectedConversation);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(peerId, selectedConversation);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (peerId) sendTypingStop(peerId, selectedConversation);

    const content = newMessage.trim();
    setSendingMessage(true);
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendMessage", conversationId: selectedConversation, message: content })
      });

      if (!response.ok) {
        toast.error(await readError(response, "Message not sent. Please wait a moment and try again."));
        return;
      }

      if (isConnected && peerId) {
        sendChatMessage(peerId, content, selectedConversation);
      }

      setNewMessage("");
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch {
      toast.error("Message not sent. Check your connection and try again.");
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
      if (!response.ok) {
        setSearchResults([]);
        return;
      }
      const results = await response.json();
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    }
  };

  async function handleStartConversation(userId: string) {
    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createConversation", userId })
      });
      if (!response.ok) {
        toast.error("You can message a teacher once you have booked a session or enrolled in their course.");
        return;
      }
      const conversation = await response.json();
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      await loadConversations();
      if (conversation?.id) openConversation(conversation.id);
    } catch {
      toast.error("Could not start the conversation");
    }
  }

  const isTyperTyping = selectedConversation && peerId
    ? typingUsers[selectedConversation]?.includes(peerId)
    : false;

  if (loading) {
    return (
      <div className="h-full flex">
        <div className="w-full md:w-1/3 md:border-r">
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
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background min-h-0">
      {/* Conversations list */}
      <div className={`${mobileView === "thread" ? "hidden" : "flex"} md:flex w-full md:w-1/3 md:border-r flex-col min-h-0`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
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
                      placeholder="Search by name..."
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
                                <AvatarFallback>{initial(user.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{user.name}</p>
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

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm text-muted-foreground">
                  Messaging opens once you book a mentor or enroll in a course
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => {
                  const otherId = conversation.otherParticipant?.id;
                  return (
                    <Card
                      key={conversation.id}
                      className={`cursor-pointer transition-colors ${selectedConversation === conversation.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                        }`}
                      onClick={() => openConversation(conversation.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={constructS3Url(conversation.displayImage || "")} />
                              <AvatarFallback>{initial(conversation.displayName)}</AvatarFallback>
                            </Avatar>
                            {otherId && onlineUsers.has(otherId) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">{conversation.displayName}</p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground truncate">
                                  {otherId && typingUsers[conversation.id]?.includes(otherId)
                                    ? <span className="text-primary animate-pulse">Typing...</span>
                                    : conversation.lastMessage.content
                                  }
                                </p>
                                <p className="text-xs text-muted-foreground shrink-0">
                                  {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Thread */}
      <div className={`${mobileView === "list" ? "hidden" : "flex"} md:flex flex-1 flex-col min-h-0`}>
        {selectedConversation && currentConversation ? (
          <>
            <div className="p-4 border-b bg-background">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileView("list")}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={constructS3Url(currentConversation.displayImage || "")} />
                    <AvatarFallback>{initial(currentConversation.displayName)}</AvatarFallback>
                  </Avatar>
                  {peerId && onlineUsers.has(peerId) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{currentConversation.displayName}</h3>
                  {peerId && isConnected && (
                    <p className="text-sm text-muted-foreground">
                      {onlineUsers.has(peerId) ? "Online" : "Offline"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-4">
              <div className="space-y-4">
                {messagesLoading && messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">Loading messages...</p>
                )}
                {!messagesLoading && messages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No messages yet. Say hello!
                  </p>
                )}
                {messages.map((message, index) => {
                  const isOwn = message.sender.id === currentUserId;
                  const showAvatar = index === messages.length - 1 ||
                    messages[index + 1]?.sender.id !== message.sender.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showAvatar ? "mb-4" : "mb-1"}`}
                    >
                      <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-[85%] md:max-w-[70%]`}>
                        {showAvatar && !isOwn && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={constructS3Url(message.sender.image || "")} />
                            <AvatarFallback className="text-xs">{initial(message.sender.name)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 ${isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                            }`}
                        >
                          {currentConversation.isGroup && !isOwn && (
                            <p className="text-xs font-medium mb-0.5">{message.sender.name}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!showAvatar && !isOwn && <div className="w-6" />}
                      </div>
                    </div>
                  );
                })}

                {isTyperTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="flex flex-row items-end space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={constructS3Url(currentConversation.displayImage || "")} />
                        <AvatarFallback className="text-xs">{initial(currentConversation.displayName)}</AvatarFallback>
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
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Messages</h3>
              <p className="text-muted-foreground mb-6">
                {conversations.length === 0
                  ? "Messaging opens once you book a mentor or enroll in a course"
                  : "Select a conversation to start messaging."}
              </p>
              {conversations.length > 0 && (
                <Button onClick={() => setIsSearchOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
