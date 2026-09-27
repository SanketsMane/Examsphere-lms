import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, User, Video, BookOpen, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Server renders in UTC on prod; students are in India
const IST = "Asia/Kolkata";
const formatIstDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "long", year: "numeric" });
const formatIstTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });

async function getUpcomingSessions(userId: string) {
  const now = new Date();
  
  const sessions = await prisma.liveSession.findMany({
    where: {
      scheduledAt: {
        gte: now
      },
      status: { not: "cancelled" },
      // 1:1 sessions set studentId; group sessions only have a booking row
      OR: [
        { studentId: userId },
        { bookings: { some: { studentId: userId, status: "confirmed" } } }
      ]
    },
    include: {
      teacher: {
        select: {
          user: {
            select: {
              name: true,
              image: true
            }
          }
        }
      }
    },
    orderBy: {
      scheduledAt: 'asc'
    },
    take: 10
  });

  return sessions;
}

async function getGroupClasses(userId: string) {
  const now = new Date();
  
  const classes = await prisma.groupEnrollment.findMany({
    where: {
      studentId: userId,
      class: {
        scheduledAt: {
          gte: now
        }
      }
    },
    include: {
      class: {
        include: {
          teacher: {
            select: {
              user: {
                select: {
                  name: true,
                  image: true
                }
              }
            }
          },
          subject: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      }
    },
    orderBy: {
      class: {
        scheduledAt: 'asc'
      }
    },
    take: 10
  });

  return classes;
}

export default async function DashboardCalendarPage() {
  const user = await requireUser();
  if (!user) return null;
  const [upcomingSessions, groupClasses] = await Promise.all([
    getUpcomingSessions(user.id),
    getGroupClasses(user.id)
  ]);

  const hasUpcomingEvents = upcomingSessions.length > 0 || groupClasses.length > 0;

  if (!hasUpcomingEvents) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <CalendarIcon className="h-16 w-16 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">No Upcoming Sessions</h2>
            <p className="text-muted-foreground mb-6">
              Live classes will appear here once scheduled.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/sessions">Go to Live Sessions</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Calendar</h1>
        <p className="text-muted-foreground">
          Your upcoming live sessions and group classes
        </p>
      </div>

      <div className="grid gap-8">
        {/* Live Sessions */}
        {upcomingSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Sessions ({upcomingSessions.length})
            </h2>
            <div className="grid gap-4">
              {upcomingSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {session.description}
                        </p>
                      </div>
                      <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatIstDate(new Date(session.scheduledAt))}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatIstTime(new Date(session.scheduledAt))} IST • {session.duration} min
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {session.teacher.user.name}
                        </span>
                      </div>
                    </div>

                    {session.subject && (
                      <div className="mt-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{session.subject}</Badge>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {session.meetingUrl && (
                        <Button size="sm" asChild>
                          <Link href={session.meetingUrl} target="_blank">
                            Join Session
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/dashboard/sessions">
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Group Classes */}
        {groupClasses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Classes ({groupClasses.length})
            </h2>
            <div className="grid gap-4">
              {groupClasses.map((enrollment) => {
                const classItem = enrollment.class;
                return (
                  <Card key={enrollment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{classItem.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {classItem.description}
                          </p>
                        </div>
                        <Badge variant={classItem.status === 'Scheduled' ? 'default' : 'secondary'}>
                          {classItem.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatIstDate(new Date(classItem.scheduledAt))}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatIstTime(new Date(classItem.scheduledAt))} IST • {classItem.duration} min
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {classItem.teacher.user.name}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4">
                        {((classItem as any).subject?.name || (classItem as any).subjectName) && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">{(classItem as any).subject?.name || (classItem as any).subjectName}</Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {classItem._count.enrollments} / {classItem.maxStudents} students
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        {classItem.meetingUrl && (
                          <Button size="sm" asChild>
                            <Link href={classItem.meetingUrl} target="_blank">
                              Join Class
                            </Link>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/groups">
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}