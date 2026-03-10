import { requireAdmin } from "@/app/data/auth/require-roles"; // Secure Admin Check - Author: Sanket
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconVideo, IconCalendar, IconUsers } from "@tabler/icons-react";
import { prisma as db } from "@/lib/db";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LiveSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 10;
  const skip = (currentPage - 1) * pageSize;

  const [sessions, totalSessions] = await Promise.all([
    db.liveSession.findMany({
      include: {
        teacher: true,
        bookings: true,
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.liveSession.count(),
  ]);

  const totalPages = Math.ceil(totalSessions / pageSize);

  const stats = {
    total: await db.liveSession.count(),
    scheduled: await db.liveSession.count({ where: { status: 'scheduled' } }),
    completed: await db.liveSession.count({ where: { status: 'completed' } }),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <IconVideo className="h-8 w-8" />
          Live Sessions Management
        </h1>
        <p className="text-muted-foreground">Monitor and manage all live teaching sessions</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Live Sessions</CardTitle>
          <CardDescription>View and manage live teaching sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{session.title}</p>
                  <p className="text-sm text-muted-foreground">Teacher: {session.teacher.name}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <IconCalendar className="h-4 w-4" />
                      {format(new Date(session.scheduledAt), 'PPP p')}
                    </span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <IconUsers className="h-4 w-4" />
                      {session.bookings.length}/{session.maxParticipants} booked
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={session.status === 'scheduled' ? 'default' : session.status === 'completed' ? 'secondary' : 'outline'}>
                    {session.status}
                  </Badge>

                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No sessions found</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" asChild disabled={currentPage <= 1}>
                <Link 
                  href={{
                    pathname: "/admin/live-sessions",
                    query: { page: currentPage - 1 }
                  }} 
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  Previous
                </Link>
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button variant="outline" size="sm" asChild disabled={currentPage >= totalPages}>
                <Link 
                  href={{
                    pathname: "/admin/live-sessions",
                    query: { page: currentPage + 1 }
                  }} 
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                >
                  Next
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
