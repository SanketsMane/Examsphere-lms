import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createElementSchema = z.object({
  type: z.enum(['PEN', 'SHAPE', 'TEXT', 'STICKY_NOTE', 'IMAGE', 'LINE', 'ARROW']),
  data: z.record(z.any()),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().default(0),
  strokeColor: z.string().optional(),
  fillColor: z.string().optional(),
  strokeWidth: z.number().default(1),
  opacity: z.number().default(1),
  zIndex: z.number().default(0)
});

const updateElementSchema = createElementSchema.partial();

// GET /api/whiteboard/[id]/elements - Get whiteboard elements
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
    const isAdmin = (session.user as any).role === 'admin';

    if (!isOwner && !isParticipant && !isPublic && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const elements = await prisma.whiteboardElement.findMany({
      where: { whiteboardId: id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: [
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(elements);

  } catch (error) {
    console.error('Error fetching elements:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/whiteboard/[id]/elements - Create new element
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
    const participant = await prisma.whiteboardParticipant.findUnique({
      where: {
        whiteboardId_userId: {
          whiteboardId: id,
          userId: session.user.id
        }
      },
      include: {
        whiteboard: {
          select: {
            createdById: true,
            allowDrawing: true,
            allowText: true,
            allowShapes: true,
            allowImages: true,
            allowAnnotations: true
          }
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });
    }

    const whiteboard = participant.whiteboard;
    const isOwner = whiteboard.createdById === session.user.id;
    const canEdit = participant.role === 'Owner' || participant.role === 'Collaborator';

    if (!canEdit && !isOwner) {
      return NextResponse.json({ error: "No edit permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createElementSchema.parse(body);

    // Check element type permissions
    if (validatedData.type === 'PEN' && !whiteboard.allowDrawing) {
      return NextResponse.json({ error: "Drawing not allowed" }, { status: 403 });
    }
    if (validatedData.type === 'TEXT' && !whiteboard.allowText) {
      return NextResponse.json({ error: "Text not allowed" }, { status: 403 });
    }
    if (['SHAPE', 'LINE', 'ARROW'].includes(validatedData.type) && !whiteboard.allowShapes) {
      return NextResponse.json({ error: "Shapes not allowed" }, { status: 403 });
    }
    if (validatedData.type === 'IMAGE' && !whiteboard.allowImages) {
      return NextResponse.json({ error: "Images not allowed" }, { status: 403 });
    }
    if (validatedData.type === 'STICKY_NOTE' && !whiteboard.allowAnnotations) {
      return NextResponse.json({ error: "Annotations not allowed" }, { status: 403 });
    }

    const elementData = {
      type: {
        'PEN': 'Pen',
        'SHAPE': 'Shape',
        'TEXT': 'Text',
        'STICKY_NOTE': 'Sticky',
        'IMAGE': 'Image',
        'LINE': 'Line',
        'ARROW': 'Arrow'
      }[validatedData.type] as any, // Cast to any to satisfy Prisma enum type if strictly typed
      data: {
        ...validatedData.data,
        rotation: validatedData.rotation,
        zIndex: validatedData.zIndex,
        style: {
          strokeColor: validatedData.strokeColor,
          fillColor: validatedData.fillColor,
          strokeWidth: validatedData.strokeWidth,
          opacity: validatedData.opacity
        }
      },
      x: validatedData.x,
      y: validatedData.y,
      width: validatedData.width,
      height: validatedData.height,
      strokeColor: validatedData.strokeColor || "#000000",
      fillColor: validatedData.fillColor,
      strokeWidth: validatedData.strokeWidth,
      opacity: validatedData.opacity,
      whiteboardId: id,
      createdById: session.user.id,
      elementId: crypto.randomUUID()
    };

    const element = await prisma.whiteboardElement.create({
      data: elementData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(element, { status: 201 });

  } catch (error) {
    console.error('Error creating element:', error);

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

// DELETE /api/whiteboard/[id]/elements - Clear all elements
export async function DELETE(
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
      select: { createdById: true }
    });

    if (!whiteboard) {
      return NextResponse.json({ error: "Whiteboard not found" }, { status: 404 });
    }

    const isOwner = whiteboard.createdById === session.user.id;
    const isAdmin = (session.user as any).role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.whiteboardElement.deleteMany({
      where: { whiteboardId: id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error clearing elements:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}