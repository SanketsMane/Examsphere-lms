import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRoomSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  lessonId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  duration: z.number().positive().default(60), // minutes
  maxParticipants: z.number().positive().optional(),
  isRecordingEnabled: z.boolean().default(false),
  isScreenSharingEnabled: z.boolean().default(true),
  isWhiteboardEnabled: z.boolean().default(true),
  isChatEnabled: z.boolean().default(true),
  isPrivate: z.boolean().default(false),
  waitingRoomEnabled: z.boolean().default(false),
  requireModerator: z.boolean().default(false),
  autoRecord: z.boolean().default(false),
  quality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'HD']).default('MEDIUM')
});

// GET /api/video-rooms - Get all video rooms
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status') as 'WAITING' | 'ACTIVE' | 'ENDED' | null;
    const upcoming = searchParams.get('upcoming') === 'true';

    let whereClause: any = {};

    if (courseId) whereClause.courseId = courseId;
    if (status) whereClause.status = status;
    
    if (upcoming) {
      whereClause.scheduledFor = {
        gte: new Date()
      };
    }

    // Students can only see rooms they're participants of or public rooms
    if ((session.user as any).role === 'student') {
      whereClause.OR = [
        { isPrivate: false },
        { 
          participants: {
            some: { userId: session.user.id }
          }
        }
      ];
    }

    const rooms = await prisma.videoRoom.findMany({
      where: whereClause,
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        course: {
          select: { id: true, title: true }
        },
        chapter: {
          select: { id: true, title: true }
        },
        lesson: {
          select: { id: true, title: true }
        },
        _count: {
          select: {
            participants: true,
            recordings: true,
            chatMessages: true
          }
        }
      },
      orderBy: [
        { scheduledFor: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(rooms);

  } catch (error) {
    console.error('Error fetching video rooms:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// POST /api/video-rooms - Create new video room
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can create video rooms
    if ((session.user as any).role !== 'teacher' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    // Generate unique room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const room = await prisma.videoRoom.create({
      data: {
        ...validatedData,
        roomId,
        hostId: session.user.id,
        status: 'WAITING',
        participants: {
          create: {
            userId: session.user.id,
            role: 'HOST',
            joinedAt: new Date()
          }
        }
      },
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    });

    return NextResponse.json(room, { status: 201 });

  } catch (error) {
    console.error('Error creating video room:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}