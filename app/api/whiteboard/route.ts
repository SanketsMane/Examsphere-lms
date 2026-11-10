import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createWhiteboardSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  lessonId: z.string().optional(),
  sessionId: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowDrawing: z.boolean().default(true),
  allowText: z.boolean().default(true),
  allowShapes: z.boolean().default(true),
  allowImages: z.boolean().default(true),
  allowAnnotations: z.boolean().default(true),
  width: z.number().default(1920),
  height: z.number().default(1080),
  backgroundColor: z.string().default("#ffffff"),
  maxParticipants: z.number().optional()
});

const updateWhiteboardSchema = createWhiteboardSchema.partial();

// GET /api/whiteboard - Get all whiteboards or filter by course/session
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
    const chapterId = searchParams.get('chapterId');
    const lessonId = searchParams.get('lessonId');
    const sessionId = searchParams.get('sessionId');

    let whereClause: any = {};

    if (courseId) whereClause.courseId = courseId;
    if (chapterId) whereClause.chapterId = chapterId;
    if (lessonId) whereClause.lessonId = lessonId;
    if (sessionId) whereClause.sessionId = sessionId;

    // Students can only see public whiteboards or ones they participate in
    if ((session.user as any).role === 'student') {
      whereClause.OR = [
        { isPublic: true },
        { 
          participants: {
            some: { userId: session.user.id }
          }
        }
      ];
    }

    const whiteboards = await prisma.whiteboard.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            elements: true,
            participants: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(whiteboards);

  } catch (error) {
    console.error('Error fetching whiteboards:', error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// POST /api/whiteboard - Create new whiteboard
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can create whiteboards
    if ((session.user as any).role !== 'teacher' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createWhiteboardSchema.parse(body);

    const whiteboard = await prisma.whiteboard.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
        participants: {
          create: {
            userId: session.user.id,
            role: 'Owner',
            isOnline: true,
            cursorColor: '#007bff'
          }
        }
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return NextResponse.json(whiteboard, { status: 201 });

  } catch (error) {
    console.error('Error creating whiteboard:', error);
    
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