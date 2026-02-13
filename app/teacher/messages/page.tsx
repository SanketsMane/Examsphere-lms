"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function TeacherMessagesPage() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAsRead", conversationId: selectedConversation })
      });
    }
  }, [selectedConversation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      const convs = await response.json();
      setConversations(convs);
      if (convs.length > 0 && !selectedConversation) {
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sendMessage", conversationId: selectedConversation, message: newMessage.trim() })
      });
      setNewMessage("");
      await loadMessages(selectedConversation);
      await loadConversations(); // Refresh conversations to update last message
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload file
      const uploadRes = await fetch("/api/upload/proxy", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      // Determine message type
      const messageType = file.type.startsWith("image/") ? "Image" : "File";

      // Send message with URL
      await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMessage",
          conversationId: selectedConversation,
          message: url,
          messageType
        })
      });

      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (error) {
      console.error("Error sending attachment:", error);
      toast.error("Failed to send attachment");
    } finally {
      setSendingMessage(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (loading) {
    return (
      <div className="h-[calc(100vh-80px)] flex border rounded-xl overflow-hidden bg-background shadow-sm">
        <div className="w-1/3 border-r bg-muted/5">
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
    <div className="h-[calc(100vh-80px)] flex border rounded-xl overflow-hidden bg-background shadow-sm">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r flex flex-col bg-muted/5">
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
                      placeholder="Search users..."
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
                <p className="text-sm text-muted-foreground">Start a chat</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors border-0 shadow-none ${selectedConversation === conversation.id
                      ? "bg-primary/10 text-primary-900 dark:text-primary-100"
                      : "hover:bg-muted/50 bg-transparent"
                      }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={constructS3Url(conversation.otherParticipant.image || "")} />
                          <AvatarFallback>
                            {conversation.otherParticipant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
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
                              <p className="text-sm text-muted-foreground truncate max-w-[120px]">
                                {conversation.lastMessage.content}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
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
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation && currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={constructS3Url(currentConversation.otherParticipant.image || "")} />
                  <AvatarFallback>
                    {currentConversation.otherParticipant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{currentConversation.otherParticipant.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
                          className={`rounded-2xl px-4 py-2 ${isOwn
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-muted rounded-bl-none"
                            }`}
                        >
                          {message.messageType === "Image" ? (
                            <img src={message.content} alt="Attachment" className="max-w-full rounded-lg" />
                          ) : message.messageType === "File" ? (
                            <a href={message.content} target="_blank" rel="noopener noreferrer" className="underline break-all">
                              📎 Attachment
                            </a>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <p className={`text-[10px] mt-1 text-right ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendingMessage}
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="pr-10"
                    disabled={sendingMessage}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    <Send className={`h-5 w-5 ${newMessage.trim() ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Conversations</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Connect with your students, answer questions, and manage your communication all in one place.
            </p>
            <Button onClick={() => setIsSearchOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start New Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
