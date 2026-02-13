import { Suspense } from "react";
import { requireUser } from "@/app/data/user/require-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Star,
  Download,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { StudentSessionCard } from "./_components/StudentSessionCard";
import { SuccessHandler } from "./_components/SuccessHandler";
import { FeedbackDialog } from "@/components/sessions/FeedbackDialog";

export const dynamic = "force-dynamic";

async function getUserSessions(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  const [bookings, total] = await Promise.all([
    prisma.sessionBooking.findMany({
      where: { studentId: userId },
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
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),
    prisma.sessionBooking.count({ where: { studentId: userId } })
  ]);

  return { bookings, total, pages: Math.ceil(total / limit) };
}

export default async function SessionsDashboard({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const user = await requireUser();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Live Sessions</h1>
          <p className="text-muted-foreground">
            Manage your upcoming and past learning sessions
          </p>
        </div>
        <Link href="/live-sessions">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Video className="mr-2 h-4 w-4" />
            Book New Session
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <SuccessHandler />
      </Suspense>

      {/* Session Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="upcoming" page={page} />
          </Suspense>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="completed" page={page} />
          </Suspense>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="cancelled" page={page} />
          </Suspense>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Suspense fallback={<SessionsLoadingSkeleton />}>
            <SessionsList userId={user.id} filter="all" page={page} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function SessionsList({ userId, filter, page }: { userId: string; filter: string; page: number }) {
  const { bookings, pages } = await getUserSessions(userId, page);

  // Filter bookings based on status and date
  const now = new Date();
  let filteredBookings = bookings;

  switch (filter) {
    case "upcoming":
      filteredBookings = bookings.filter(b =>
        b.session.scheduledAt && b.session.scheduledAt > now &&
        (b.status === "confirmed" || b.status === "pending")
      );
      break;
    case "completed":
      filteredBookings = bookings.filter(b =>
        b.session.status === "completed"
      );
      break;
    case "cancelled":
      filteredBookings = bookings.filter(b =>
        b.status === "cancelled" || b.status === "refunded" ||
        b.session.status === "cancelled"
      );
      break;
    default:
      // Show all bookings
      break;
  }

  if (filteredBookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
          <p className="text-muted-foreground mb-6">
            {filter === "upcoming"
              ? "You don't have any upcoming sessions scheduled."
              : `No ${filter} sessions to display.`
            }
          </p>
          {filter === "upcoming" && (
            <Link href="/live-sessions">
              <Button>Book Your First Session</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
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

function SessionCard({ session }: { session: any }) {
  const sessionDate = new Date(session.scheduledAt);
  const now = new Date();
  const isUpcoming = sessionDate > now && session.status === "scheduled";
  const canJoin = isUpcoming && sessionDate <= new Date(now.getTime() + 15 * 60000); // 15 minutes before

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "no_show":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
      case "in_progress":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
      case "no_show":
        return <XCircle className="h-4 w-4" />;
      case "in_progress":
        return <Video className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{session.title}</CardTitle>
              <Badge className={getStatusColor(session.status)}>
                {getStatusIcon(session.status)}
                <span className="ml-1">{session.status}</span>
              </Badge>
            </div>
            <p className="text-muted-foreground">{session.description}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              ${(session.price / 100).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {session.duration} minutes
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Teacher Info */}
        <div className="flex items-center space-x-3">
          <img
            src={session.teacher.user.image || `https://avatar.vercel.sh/${session.teacher.user.name}`}
            alt={session.teacher.user.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <div className="font-semibold">{session.teacher.user.name}</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span>{session.teacher.rating || "5.0"}</span>
              <span>• Instructor</span>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">{sessionDate.toLocaleDateString()}</div>
              <div className="text-muted-foreground">Date</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium">
                {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-muted-foreground">Time</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-purple-600" />
            <div>
              <div className="font-medium">{session.subject}</div>
              <div className="text-muted-foreground">Subject</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Video className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">Online</div>
              <div className="text-muted-foreground">Format</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {canJoin && (
            <Link href={`/video-call/${session.id}`}>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Video className="mr-2 h-4 w-4" />
                Join Session
              </Button>
            </Link>
          )}

          {isUpcoming && !canJoin && (
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
          )}

          {session.status === "completed" && (
            <>
              {session.recordingUrl && (
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Recording
                </Button>
              )}
              <FeedbackDialog 
                sessionId={session.id} 
                sessionTitle={session.title}
                trigger={
                  <Button variant="outline">
                    <Star className="mr-2 h-4 w-4" />
                    Rate Session
                  </Button>
                }
              />
            </>
          )}

          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message Teacher
          </Button>

          {isUpcoming && (
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
