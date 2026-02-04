
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.aiConversation.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("[AI_CONVERSATION_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const conversation = await prisma.aiConversation.deleteMany({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (conversation.count === 0) {
       return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    return new NextResponse("OK");
  } catch (error: any) {
    console.error("[AI_CONVERSATION_DELETE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
