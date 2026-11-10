import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const addParticipantSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(['Owner', 'Collaborator', 'Viewer']).default('Viewer'),
  cursorColor: z.string().optional()
});

const updateParticipantSchema = z.object({
  role: z.enum(['Owner', 'Collaborator', 'Viewer']).optional(),
  cursorColor: z.string().optional(),
  isOnline: z.boolean().optional()
});

// GET /api/whiteboard/[id]/participants - Get whiteboard participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check access to whiteboard
    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id },
      select: {
        createdById: true,
        isPublic: true,
        participants: { where: { userId: session.user.id } }
      }
    });

    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    const isOwner = whiteboard.createdById === session.user.id;
    const isParticipant = whiteboard.participants.length > 0;
    const isPublic = whiteboard.isPublic;
    const isAdminOrTeacher = ['admin', 'teacher'].includes((session.user as any).role || '');

    if (!isOwner && !isParticipant && !isPublic && !isAdminOrTeacher) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const participants = await prisma.whiteboardParticipant.findMany({
      where: { whiteboardId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    return NextResponse.json(participants);

  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/whiteboard/[id]/participants - Add participant to whiteboard
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id },
      select: {
        createdById: true,
        maxParticipants: true,
        _count: { select: { participants: true } }
      }
    });

    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    const isOwner = whiteboard.createdById === session.user.id;
    const isAdminOrTeacher = ['admin', 'teacher'].includes((session.user as any).role || '');

    if (!isOwner && !isAdminOrTeacher) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check participant limit
    if (whiteboard.maxParticipants && whiteboard._count.participants >= whiteboard.maxParticipants) {
      return NextResponse.json({ error: "Maximum participants reached" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = addParticipantSchema.parse(body);

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already participant
    const existingParticipant = await prisma.whiteboardParticipant.findUnique({
      where: {
        whiteboardId_userId: {
          whiteboardId: id,
          userId: validatedData.userId
        }
      }
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "User is already a participant" }, { status: 400 });
    }

    // Generate random cursor color if not provided
    const cursorColor = validatedData.cursorColor || `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    const participant = await prisma.whiteboardParticipant.create({
      data: {
        whiteboardId: id,
        userId: validatedData.userId,
        role: validatedData.role,
        cursorColor,
        isOnline: true
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(participant, { status: 201 });

  } catch (error) {
    console.error('Error adding participant:', error);

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