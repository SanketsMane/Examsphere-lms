import { Suspense } from "react";
import { requireUser } from "@/app/data/user/require-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Video } from "lucide-react";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { StudentSessionCard } from "./_components/StudentSessionCard";
import { SuccessHandler } from "./_components/SuccessHandler";

export const dynamic = "force-dynamic";

type SessionFilter = "upcoming" | "completed" | "cancelled" | "all";

// Filtering happens in the query so each tab paginates over its own rows, not over
// whatever slice of all bookings happened to land on the current page.
function bookingWhere(userId: string, filter: SessionFilter): Prisma.SessionBookingWhereInput {
  const now = new Date();
  switch (filter) {
    case "upcoming":
      // Pending = payment not finished; still shown so the student can see the seat is unconfirmed
      return {
        studentId: userId,
        status: { in: ["confirmed", "pending"] },
        session: { scheduledAt: { gt: now }, status: { not: "cancelled" } },
      };
    case "completed":
      return {
        studentId: userId,
        status: "confirmed",
        session: { status: "completed" },
      };
    case "cancelled":
      return {
        studentId: userId,
        OR: [
          { status: { in: ["cancelled", "refunded"] } },
          { session: { status: "cancelled" } },
        ],
      };
    default:
      return { studentId: userId };
  }
}

async function getUserSessions(userId: string, filter: SessionFilter, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const where = bookingWhere(userId, filter);

  const [bookings, total] = await Promise.all([
    prisma.sessionBooking.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            title: true,
            description: true,
            subject: true,
            scheduledAt: true,
            duration: true,
            status: true,
            meetingUrl: true,
            recordingUrl: true,
            studentRating: true,
            cancelledBy: true,
            cancellationReason: true,
            teacher: {
              include: {
                user: {
                  select: { name: true, image: true, id: true }
                }
              }
            }
          }
        }
      },
      orderBy: filter === "upcoming" ? { session: { scheduledAt: "asc" } } : { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.sessionBooking.count({ where })
  ]);

  return { bookings, total, pages: Math.ceil(total / limit) };
}

export default async function SessionsDashboard({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1") || 1);
  const user = await requireUser();
  if (!user) return null;

  // Only point students to the public listing when there is something to book
  const openSessions = await prisma.liveSession.count({
    where: { status: "scheduled", scheduledAt: { gt: new Date() } },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Live Sessions</h1>
          <p className="text-muted-foreground">
            Manage your upcoming and past learning sessions
          </p>
        </div>
        {openSessions > 0 && (
          <Button asChild>
            <Link href="/live-sessions">
              <Video className="mr-2 h-4 w-4" />
              Browse Live Classes
            </Link>
          </Button>
        )}
      </div>

      <Suspense fallback={null}>
        <SuccessHandler />
      </Suspense>

      {/* Session Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="upcoming" page={page} canBrowse={openSessions > 0} />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="completed" page={page} canBrowse={openSessions > 0} />
          </Suspense>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="cancelled" page={page} canBrowse={openSessions > 0} />
          </Suspense>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="all" page={page} canBrowse={openSessions > 0} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function SessionsList({
  userId,
  filter,
  page,
  canBrowse,
}: {
  userId: string;
  filter: SessionFilter;
  page: number;
  canBrowse: boolean;
}) {
  const { bookings, pages } = await getUserSessions(userId, filter, page);

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Video className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {filter === "upcoming" ? "No upcoming sessions" : "No sessions found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {filter === "upcoming"
              ? "Live classes will appear here once scheduled."
              : `No ${filter === "all" ? "" : filter + " "}sessions to display.`
            }
          </p>
          {filter === "upcoming" && canBrowse && (
            <Button asChild>
              <Link href="/live-sessions">Browse Live Classes</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {bookings.map((booking) => (
          // @ts-ignore - Subject nullable mismatch
          <StudentSessionCard key={booking.id} booking={booking} />
        ))}
      </div>

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            asChild={page > 1}
          >
            {page > 1 ? (
              <Link href={`/dashboard/sessions?page=${page - 1}`}>Previous</Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {pages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            asChild={page < pages}
          >
            {page < pages ? (
              <Link href={`/dashboard/sessions?page=${page + 1}`}>Next</Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function SessionsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-12 w-full" />
              ))}
            </div>
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
