import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createSessionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  subject: z.string().min(2),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  duration: z.number().min(15).max(480), // 15 mins to 8 hours
  price: z.number().min(50), // Minimum 50 cents (0.5 USD in cents)
  timezone: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().nullable().optional(),
});

// GET - List all sessions for a teacher
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile or create one if it doesn't exist (using upsert for safety)
    const teacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        bio: 'Welcome to teaching!',
        expertise: ['General'],
        hourlyRate: 50,
        isVerified: true,
        isApproved: true,
        rating: 5.0,
        totalEarnings: 0,
        totalReviews: 0,
      },
      update: {},
    });

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      teacherId: teacherProfile.id
    };

    if (status !== 'all') {
      where.status = status;
    }

    // Fetch sessions with pagination
    const [sessions, totalCount] = await Promise.all([
      prisma.liveSession.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: {
          scheduledAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.liveSession.count({ where })
    ]);

    // Calculate stats
    // 1. Total Earnings: Sum of commissions from sessions (Net Earnings)
    const earningsData = await prisma.commission.aggregate({
      where: {
        teacherId: teacherProfile.id,
        sessionId: { not: null }, // Only session earnings
        status: { in: ['Pending', 'Approved', 'PaidOut'] } // Count pending, approved, and paid out commissions
      },
      _sum: {
        amount: true
      }
    });

    // 2. Average Rating: Avg of SessionRating
    const ratingData = await prisma.sessionRating.aggregate({
      where: {
        teacherId: teacherProfile.id
      },
      _avg: {
        rating: true
      }
    });

    // 3. Total Sessions & Counts
    const statsData = await prisma.liveSession.aggregate({
      where: { teacherId: teacherProfile.id },
      _count: { _all: true }
    });

    const [upcomingCount, completedCount] = await Promise.all([
      prisma.liveSession.count({
        where: {
          teacherId: teacherProfile.id,
          scheduledAt: { gte: new Date() },
          status: 'scheduled'
        }
      }),
      prisma.liveSession.count({
        where: {
          teacherId: teacherProfile.id,
          status: 'completed'
        }
      })
    ]);

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: statsData._count._all || 0,
        upcoming: upcomingCount || 0,
        completed: completedCount || 0,
        totalEarnings: Number(earningsData._sum?.amount) || 0,
        averageRating: ratingData._avg.rating || 0
      }
    });
  } catch (error) {
    console.error("Error fetching teacher sessions:", error);
    return NextResponse.json({
      sessions: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      stats: { total: 0, upcoming: 0, completed: 0, totalEarnings: 0 },
      error: "Internal server error"
    }, { status: 500 });
  }
}

// POST - Create a new session
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const json = await req.json();
    const validation = createSessionSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      subject,
      scheduledAt,
      duration,
      price,
      timezone,
      isRecurring,
      recurringPattern
    } = validation.data;

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflictingSession = await prisma.liveSession.findFirst({
      where: {
        teacherId: teacherProfile.id,
        status: { in: ['scheduled', 'in_progress'] },
        OR: [
          {
            // New session starts during existing session
            AND: [
              { scheduledAt: { lte: scheduledDate } },
              {
                scheduledAt: {
                  gte: new Date(scheduledDate.getTime() - duration * 60000)
                }
              }
            ]
          },
          {
            // Existing session overlaps with new session
            scheduledAt: {
              gte: scheduledDate,
              lt: new Date(scheduledDate.getTime() + duration * 60000)
            }
          }
        ]
      }
    });

    if (conflictingSession) {
      return NextResponse.json(
        { error: "Time slot conflicts with another session" },
        { status: 409 }
      );
    }

    // Create the session
    const newSession = await prisma.liveSession.create({
      data: {
        teacherId: teacherProfile.id,
        title,
        description,
        subject,
        scheduledAt: scheduledDate,
        duration,
        price,
        timezone: timezone || 'UTC',
        isRecurring: isRecurring || false,
        recurringPattern: recurringPattern || null,
        status: 'scheduled'
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    // ----------------------------------------------------------------
    // NOTIFICATION: Alert previous students about new session
    // ----------------------------------------------------------------
    (async () => {
      try {
        // Find students who have enrolled in ANY course by this teacher
        const previousEnrollments = await prisma.enrollment.findMany({
           where: {
             Course: {
               userId: teacherProfile.userId
             },
             status: 'Active' // Only active students
           },
           distinct: ['userId'], // Avoid duplicate emails
           include: {
             User: {
               select: { email: true, name: true }
             },
             Course: {
               select: { title: true }
             }
           }
        });

        if (previousEnrollments.length > 0) {
           const { sendNewSessionNotification } = await import("@/lib/email-notifications");
           const sessionLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/live-sessions/${newSession.id}`;
           const teacherName = session.user.name || "Your Instructor";

           // Send emails in parallel
           await Promise.all(previousEnrollments.map(enrollment => {
              // Check if user and email exist to satisfy TS
              if (enrollment.User?.email) {
                  return sendNewSessionNotification(
                    enrollment.User.email,
                    enrollment.User.name || "Student",
                    teacherName,
                    newSession.title,
                    newSession.description || "Join my new live session!",
                    sessionLink
                  ).catch(e => console.error(`Failed to email student ${enrollment.User.email}`, e));
              }
           }));
           console.log(`Sent new session alerts to ${previousEnrollments.length} students`);
        }
      } catch (err) {
        console.error("Error sending new session notifications:", err);
      }
    })(); 

    return NextResponse.json({
      message: "Session created successfully",
      session: newSession
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
