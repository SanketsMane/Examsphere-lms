import { notFound, redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Star,
  Video,
  Shield,
  ArrowLeft,
  CheckCircle,
  Globe
} from "lucide-react";
import Link from "next/link";
import { format, formatDistance, isPast } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getSession(id: string) {
  const session = await db.groupClass.findUnique({
    where: { id },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
              email: true
            }
          }
        }
      },
      enrollments: {
        where: {
          status: 'Active'
        }
      }
    }
  });

  if (!session) {
    notFound();
  }

  return session;
}

export default async function SessionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await getSession(params.id);
  const sessionAuth = await auth.api.getSession({ headers: await headers() });

  const confirmedBookings = session.enrollments.length;
  const spotsLeft = session.maxStudents
    ? session.maxStudents - confirmedBookings
    : null;

  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const hasExpired = session.scheduledAt ? isPast(session.scheduledAt) : false;
  const canBook = !isFull && !hasExpired && session.status === 'Scheduled';

  // Check if user already booked
  let existingBooking = null;
  if (sessionAuth?.user) {
    existingBooking = await db.groupEnrollment.findFirst({
      where: {
        classId: session.id,
        studentId: sessionAuth.user.id,
        status: { in: ['Active', 'Pending'] }
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-6xl">
        {/* Back Button */}
        <Link href="/live-sessions">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="font-medium">
                  {(session as any).subject?.name || (session as any).subjectName || "Group Class"}
                </Badge>
                <Badge variant={session.status === 'Scheduled' ? 'default' : 'secondary'}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4">{session.title}</h1>

              {session.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {session.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session.scheduledAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">Date & Time</p>
                      <p className="text-muted-foreground">
                        {format(session.scheduledAt, "EEEE, MMMM dd, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(session.scheduledAt, "h:mm a")} ({session.teacher?.timezone || 'UTC'})
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">Duration</p>
                    <p className="text-muted-foreground">{session.duration} minutes</p>
                  </div>
                </div>

                {session.maxStudents && (
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold">Participants</p>
                      <p className="text-muted-foreground">
                        {confirmedBookings} / {session.maxStudents} enrolled
                      </p>
                      {spotsLeft !== null && spotsLeft > 0 && (
                        <p className="text-sm text-green-600 font-medium">
                          {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-semibold">Platform</p>
                    <p className="text-muted-foreground">Live video call via platform</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You'll Learn */}
            <Card>
              <CardHeader>
                <CardTitle>What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>Interactive group session with community learning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>Real-time Q&A and problem solving</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>Hands-on practice and code review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>Recording available for 7 days after session</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Instructor */}
            <Card>
              <CardHeader>
                <CardTitle>Your Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={session.teacher.user.image || undefined} />
                    <AvatarFallback className="text-lg">
                      {session.teacher.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{session.teacher.user.name}</h3>
                    {session.teacher.bio && (
                      <p className="text-muted-foreground">{session.teacher.bio}</p>
                    )}
                    {session.teacher.expertise && session.teacher.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {session.teacher.expertise.map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* Booking Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    {session.price === 0 ? (
                      <>
                        <Badge className="text-2xl px-6 py-2 bg-green-600 hover:bg-green-700 mb-2">FREE</Badge>
                        <p className="text-sm text-muted-foreground">No payment required</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <DollarSign className="h-8 w-8 text-green-600" />
                          <span className="text-4xl font-bold">${(session.price / 100).toFixed(0)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">One-time payment</p>
                      </>
                    )}
                  </div>

                  {existingBooking ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-1">
                          <CheckCircle className="h-5 w-5" />
                          Already Booked
                        </div>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          You have a confirmed booking for this session
                        </p>
                      </div>
                      <Link href="/dashboard/sessions">
                        <Button variant="outline" className="w-full">
                          View My Sessions
                        </Button>
                      </Link>
                    </div>
                  ) : canBook ? (
                    sessionAuth?.user ? (
                      <Link href={`/live-sessions/${session.id}/book`}>
                        <Button className="w-full" size="lg">
                          <Video className="mr-2 h-5 w-5" />
                          {session.price === 0 ? "Enroll for Free" : "Book This Session"}
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/login?redirect=/live-sessions/${session.id}`}>
                        <Button className="w-full" size="lg">
                          Sign in to Book
                        </Button>
                      </Link>
                    )
                  ) : (
                    <Button disabled className="w-full" size="lg">
                      {isFull ? 'Session Full' : hasExpired ? 'Session Expired' : 'Not Available'}
                    </Button>
                  )}

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Secure payment via Razorpay</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      <span>Full refund if cancelled 48hrs+ before</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>Join from any device</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-center mb-4">Why Book With Us</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <Shield className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium">Money-Back Guarantee</p>
                        <p className="text-xs text-muted-foreground">100% refund if not satisfied</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Users className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium">Verified Instructors</p>
                        <p className="text-xs text-muted-foreground">All experts are vetted</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Star className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="font-medium">High Quality</p>
                        <p className="text-xs text-muted-foreground">4.9+ average rating</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
