
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Assuming prisma is exported from lib/db

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversations = await prisma.aiConversation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20, // Limit to 20 recent conversations
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("[AI_CONVERSATIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title } = await req.json() as { title?: string };

    const conversation = await prisma.aiConversation.create({
      data: {
        userId: session.user.id,
        title: title || "New Chat",
      },
    });

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("[AI_CONVERSATIONS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
