
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Configuration for Flowversal AI
const FLOWVERSAL_API_URL = "http://139.84.155.227:3000/api/tanchat";
const FLOWVERSAL_API_KEY = "sk-61285d7b0909e3681bd84c2290a7199410b241fc889bf45f";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    interface ChatRequestBody {
      messages: { role: string; content: string }[];
      conversationId?: string;
      attachments?: string[];
    }

    const { messages, conversationId, attachments } = await req.json() as ChatRequestBody;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Invalid messages format", { status: 400 });
    }

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];

    // Verify conversation ownership if conversationId is provided
    if (conversationId) {
        const conversation = await prisma.aiConversation.findFirst({
            where: {
                id: conversationId,
                userId: session.user.id
            }
        });

        if (!conversation) {
            return new NextResponse("Conversation not found or access denied", { status: 404 });
        }
    }

    // Persist User Message if conversationId is provided
    if (conversationId && latestUserMessage.role === "user") {
        await prisma.aiMessage.create({
            data: {
                conversationId,
                role: "user",
                content: latestUserMessage.content,
                attachments: attachments || []
            }
        });
        
        // Update conversation updated_at
        await prisma.aiConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });
    }
    
    // Fetch History Context if conversationId provided
    let contextMessages: any[] = [];
    if (conversationId) {
        // Fetch LATEST 10 messages
        const history = await prisma.aiMessage.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        
        // Reverse to maintain chronological order for LLM
        contextMessages = history.reverse().map((msg: { role: string; content: string }) => ({
            role: msg.role,
            content: msg.content
        }));
    } else {
        // Fallback or just use provided messages if no persistent convo
        contextMessages = messages.length > 10 ? messages.slice(-10) : messages;
    }

    // Ensure system prompt is first
    const systemPrompt = `You are Kidokool Ai, a helpful AI assistant for the Kidokool LMS platform. 
    The current user is a ${(session.user as any).role}. 
    Provide concise, helpful, and accurate information. If they ask about Kidokool, mention that it's a language learning platform.
    Be friendly and professional. Support markdown in your responses.`;
    
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...contextMessages
    ];
    
    // Prepare payload for Flowversal AI
    const payload = {
      messages: chatMessages,
      data: {
        provider: "ollama",
        model: "qwen2.5:14b"
      }
    };

    console.log("[AI_CHAT] Sending request to Flowversal AI...");

    const response = await fetch(FLOWVERSAL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FLOWVERSAL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[AI_CHAT_ERROR] Upstream API error:", response.status, errorText);
        return new NextResponse(`AI Service Error: ${response.status}`, { status: response.status });
    }

    if (!response.body) {
        throw new Error("No response body received from AI service");
    }

    // Handle SSE Stream and aggregate response (ROBUST SSE PARSER)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            let lineBreakIndex;
            while ((lineBreakIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, lineBreakIndex).trim();
                buffer = buffer.slice(lineBreakIndex + 1);
                
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data.trim() === '[DONE]') continue;
                    
                    try {
                        const json = JSON.parse(data);
                        // Upstream API uses 'delta' for chunk content
                        if (json.delta) {
                            fullContent += json.delta;
                        } else if (json.content && !json.delta) {
                            // Fallback if delta is missing but content is provided (non-cumulative)
                            // Note: Our upstream provides cumulative in 'content' and delta in 'delta'
                            // So using 'delta' is CRITICAL to avoid duplicates.
                        }
                    } catch (e) {
                         // Likely partial JSON chunk, but with line-based SSE this is rare
                         // unless upstream sends invalid JSON or multi-line data
                    }
                }
            }
        }
    } catch (streamError) {
        console.error("[AI_CHAT_ERROR] Stream processing error:", streamError);
        throw streamError;
    }

    // Persist AI Response
    if (conversationId && fullContent) {
        await prisma.aiMessage.create({
            data: {
                conversationId,
                role: "assistant",
                content: fullContent
            }
        });
    }

    return NextResponse.json({
        role: "assistant",
        content: fullContent
    });

  } catch (error: any) {
    console.error("[AI_CHAT_ERROR]", error);
    return new NextResponse("Internal Server Error: " + error.message, { status: 500 });
  }
}
