import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateWhiteboardSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  allowDrawing: z.boolean().optional(),
  allowText: z.boolean().optional(),
  allowShapes: z.boolean().optional(),
  allowImages: z.boolean().optional(),
  allowAnnotations: z.boolean().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  backgroundColor: z.string().optional(),
  maxParticipants: z.number().optional()
});

// GET /api/whiteboard/[id] - Get specific whiteboard
export async function GET(
  _request: NextRequest,
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

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id },
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
        elements: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    // Check access permissions
    const isParticipant = whiteboard.participants.some(p => p.userId === session.user.id);
    const isOwner = whiteboard.createdById === session.user.id;
    const isPublic = whiteboard.isPublic;
    const isAdminOrTeacher = ['admin', 'teacher'].includes((session.user as any).role || '');

    if (!isParticipant && !isOwner && !isPublic && !isAdminOrTeacher) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(whiteboard);

  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/whiteboard/[id] - Update whiteboard
export async function PUT(
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

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id },
      select: {
        createdById: true,
        participants: { where: { userId: session.user.id } }
      }
    });

    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    // Check permissions: Only owner or admin can update whiteboard settings
    const isOwner = whiteboard.createdById === session.user.id;
    const isAdmin = (session.user as any).role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied: Only the owner or admin can update settings" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateWhiteboardSchema.parse(body);

    const updatedWhiteboard = await prisma.whiteboard.update({
      where: { id },
      data: validatedData,
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

    return NextResponse.json(updatedWhiteboard);

  } catch (error) {
    console.error('Error updating whiteboard:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/whiteboard/[id] - Delete whiteboard
export async function DELETE(
  _request: NextRequest,
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

    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id },
      select: { createdById: true }
    });

    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    // Only owner or admin can delete
    const isOwner = whiteboard.createdById === session.user.id;
    const isAdmin = (session.user as any).role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.whiteboard.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}