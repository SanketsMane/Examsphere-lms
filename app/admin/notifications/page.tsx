import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Users } from "lucide-react";
import { NotificationForm } from "./_components/NotificationForm";
import { prisma } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireAdmin();

  // Fetch recent system notifications to show history
  // distinct: ['title', 'message'] isn't fully supported in all prisma adapters or might be tricky with large data
  // so we just fetch latest and maybe dedup in JS if needed, or just show them.
  // Actually, let's just show the last 5 system notifications created.
  // Since we send in batches, we might see duplicates if we just list them.
  // We can group by title roughly.
  
  const recentNotifications = await prisma.notification.findMany({
    where: { type: "System" },
    take: 20, // Take more to find uniques
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      message: true,
      createdAt: true,
    }
  });

  // Deduplicate by title
  const uniqueNotifications = Array.from(
    new Map(recentNotifications.map((item: { title: string; message: string; createdAt: Date }) => [item.title, item])).values()
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="h-8 w-8" />
          Send Notifications
        </h1>
        <p className="text-muted-foreground">Send announcements and notifications to users</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>Broadcast messages to platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>Previously sent system broadcasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uniqueNotifications.length > 0 ? (
                uniqueNotifications.map((notification, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{notification.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">System Broadcast</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent broadcasts found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

