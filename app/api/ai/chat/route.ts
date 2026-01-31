import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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

    const baseUrl = process.env.AI_BASE_URL;
    const user = process.env.AI_AUTH_USER;
    const pass = process.env.AI_AUTH_PASS;
    const model = process.env.AI_MODEL || "qwen2.5:3b";

    if (!baseUrl || !user || !pass) {
      console.error("AI Configuration missing in environment variables");
      return new NextResponse("AI Configuration Error", { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;

    // System prompt based on role
    const systemPrompt = `You are Kidokool Ai, a helpful AI assistant for the Kidokool LMS platform. 
    The current user is a ${(session.user as any).role}. 
    Provide concise, helpful, and accurate information. If they ask about Kidokool, mention that it's a language learning platform.
    Be friendly and professional. Support markdown in your responses.`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        model: model,
        messages: chatMessages,
        stream: false, // Keeping it simple without streaming for now for stability
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", errorText);
      return new NextResponse(`AI API Error: ${response.statusText}`, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data.choices[0].message);
  } catch (error: any) {
    console.error("[AI_CHAT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
