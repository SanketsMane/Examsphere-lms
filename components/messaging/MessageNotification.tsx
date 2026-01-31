"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
// Removed server action import - using API route instead
import Link from "next/link";

type Conversation = {
  id: string;
  unreadCount: number;
};

export function MessageNotification() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // Set up polling for real-time updates - Optimized: 2 minutes & visible only
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadUnreadCount();
        }
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      if (response.status === 401) {
        setUnreadCount(0);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch");
      const conversations = await response.json();
      const totalUnread = conversations.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.warn("Error loading unread count:", error);
      setUnreadCount(0);
    }
  };

  return (
    <Link href="/dashboard/messages">
      <Button variant="ghost" size="sm" className="relative">
        <MessageCircle className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}

// Floating message button for other pages
export function FloatingMessageButton() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    
    // Optimized: 2 minutes & visible only
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadUnreadCount();
        }
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch("/api/messages/conversations");
      if (response.status === 401) {
        setUnreadCount(0);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch");
      const conversations = await response.json();
      const totalUnread = conversations.reduce((sum: number, conv: Conversation) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.warn("Error loading unread count:", error);
      setUnreadCount(0);
    }
  };

  return (
    <Link href="/dashboard/messages">
      <Button
        size="lg"
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow z-50"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}