import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSessionSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional().nullable(),
  subject: z.string().min(2).optional(),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }).optional(),
  duration: z.number().min(15).max(480).optional(),
  price: z.number().min(50).optional(),
  timezone: z.string().optional(),
});

// GET - Get session details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        bookings: {
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
          where: {
            status: { in: ['confirmed', 'pending'] }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        teacher: {
          include: {
            user: {
               select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify teacher owns this session
    if (liveSession.teacher.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session: liveSession });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update session
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify teacher owns this session
    if (liveSession.teacher.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't update if session already has a student (booked)
    if (liveSession.studentId) {
      return NextResponse.json(
        { error: "Cannot update a booked session. Use reschedule instead." },
        { status: 400 }
      );
    }

    const json = await req.json();
    const validation = updateSessionSchema.safeParse(json);

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
      timezone
    } = validation.data;

    // Validate scheduled time if provided
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate < new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }

      // Conflict checks for updated time
      const finalDuration = duration || liveSession.duration;
      const conflictingSession = await prisma.liveSession.findFirst({
        where: {
          id: { not: id },
          teacherId: liveSession.teacherId,
          status: { in: ['scheduled', 'in_progress'] },
          OR: [
            {
              AND: [
                { scheduledAt: { lte: scheduledDate } },
                {
                  scheduledAt: {
                    gte: new Date(scheduledDate.getTime() - finalDuration * 60000)
                  }
                }
              ]
            },
            {
              scheduledAt: {
                gte: scheduledDate,
                lt: new Date(scheduledDate.getTime() + finalDuration * 60000)
              }
            }
          ]
        }
      });

      if (conflictingSession) {
        return NextResponse.json(
          { error: "New time slot conflicts with another session" },
          { status: 409 }
        );
      }
    } else if (duration) {
       // If only duration changed, check for conflicts at current scheduled time
       const conflictingSession = await prisma.liveSession.findFirst({
        where: {
          id: { not: id },
          teacherId: liveSession.teacherId,
          status: { in: ['scheduled', 'in_progress'] },
          OR: [
            {
              AND: [
                { scheduledAt: { lte: liveSession.scheduledAt } },
                {
                  scheduledAt: {
                    gte: new Date(liveSession.scheduledAt.getTime() - duration * 60000)
                  }
                }
              ]
            },
            {
              scheduledAt: {
                gte: liveSession.scheduledAt,
                lt: new Date(liveSession.scheduledAt.getTime() + duration * 60000)
              }
            }
          ]
        }
      });

      if (conflictingSession) {
        return NextResponse.json(
          { error: "Updated duration conflicts with another session" },
          { status: 409 }
        );
      }
    }

    const updatedSession = await prisma.liveSession.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(subject && { subject }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration && { duration }),
        ...(price && { price }),
        ...(timezone && { timezone })
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
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      message: "Session updated successfully",
      session: updatedSession
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const liveSession = await prisma.liveSession.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify teacher owns this session
    if (liveSession.teacher.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't delete if session is booked - must use cancel endpoint
    if (liveSession.studentId) {
      return NextResponse.json(
        { error: "Cannot delete a booked session. Use cancel endpoint instead." },
        { status: 400 }
      );
    }

    await prisma.liveSession.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Session deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
