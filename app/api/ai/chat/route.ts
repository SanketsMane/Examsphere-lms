import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Invalid messages format", { status: 400 });
    }

    // System prompt based on role
    const systemPrompt = `You are Kidokool Ai, a helpful AI assistant for the Kidokool LMS platform. 
    The current user is a ${(session.user as any).role}. 
    Provide concise, helpful, and accurate information. If they ask about Kidokool, mention that it's a language learning platform.
    Be friendly and professional. Support markdown in your responses.`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: chatMessages as any,
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error: any) {
    console.error("[AI_CHAT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
