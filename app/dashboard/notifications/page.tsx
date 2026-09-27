"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  MessageSquare,
  CreditCard,
  BookOpen,
  Video,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "System" | "Course" | "Session" | "Payment" | "Review" | "Message";
  isRead: boolean;
  createdAt: string;
  metadata?: any;
};

type NotificationData = {
  notifications: Notification[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  unreadCount: number;
};

export default function NotificationsPage() {
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?page=${page}&limit=20&filter=${filter}`);
      const data = await response.json();
      // Error bodies ({ error }) have no notifications array; don't let them reach the renderer
      if (!response.ok || !Array.isArray(data?.notifications)) {
        toast.error("Could not load notifications");
        return;
      }
      setNotificationData(data);
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (key: string, request: () => Promise<Response>, errorMessage: string) => {
    try {
      setActionLoading(key);
      const response = await request();
      if (!response.ok) {
        toast.error(errorMessage);
        return;
      }
      await loadNotifications();
    } catch {
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsRead = (notificationId: string) =>
    runAction(notificationId, () => fetch(`/api/notifications/${notificationId}`, { method: "PATCH" }), "Could not mark as read");

  const handleMarkAllAsRead = () =>
    runAction("mark-all", () => fetch("/api/notifications", { method: "PATCH" }), "Could not mark notifications as read");

  const handleDeleteNotification = (notificationId: string) =>
    runAction(notificationId, () => fetch(`/api/notifications/${notificationId}`, { method: "DELETE" }), "Could not delete notification");

  if (loading && !notificationData) {
    return <NotificationsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your learning activities
          </p>
        </div>

        <div className="flex items-center gap-3">
          {notificationData && notificationData.unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === "mark-all"}
              variant="outline"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read ({notificationData.unreadCount})
            </Button>
          )}

          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/notifications">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Notification Tabs */}
      <Tabs value={filter} onValueChange={(value: any) => { setFilter(value); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {notificationData?.unreadCount ? `(${notificationData.unreadCount})` : ""}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {loading ? (
            <NotificationsLoadingSkeleton />
          ) : notificationData && notificationData.notifications?.length > 0 ? (
            <>
              <div className="space-y-3">
                {notificationData.notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                    loading={actionLoading === notification.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {notificationData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ length: notificationData.totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                <p className="text-muted-foreground">
                  {filter === "unread" ? "All caught up! No unread notifications." : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  loading
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "Course":
        return <BookOpen className="h-4 w-4" />;
      case "Session":
        return <Video className="h-4 w-4" />;
      case "Payment":
        return <CreditCard className="h-4 w-4" />;
      case "Message":
        return <MessageSquare className="h-4 w-4" />;
      case "Review":
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "Course":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Session":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Payment":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "Message":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Review":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${!notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/30" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-medium truncate ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                  {notification.title}
                </h4>
                <Badge variant="secondary" className={getNotificationColor(notification.type)}>
                  {notification.type}
                </Badge>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>

              <p className={`text-sm mb-2 ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                {notification.message}
              </p>

              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-4">
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                disabled={loading}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              disabled={loading}
              title="Delete notification"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
