"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Get or create conversation between two users (1:1 chat)
 * Now also ensures entries in ConversationParticipant table.
 */
export async function getOrCreateConversation(participantId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const currentUserId = (session.user as any).id;

  // Don't create conversation with yourself
  if (currentUserId === participantId) {
    throw new Error("Cannot create conversation with yourself");
  }

  // Anti-Spam Check: Verify relationship exists before creating 1:1 conversation
  // Relationship = Enrollment (Student/Teacher) or Session Booking
  const hasRelationship = await prisma.enrollment.findFirst({
    where: {
      OR: [
        { userId: currentUserId, Course: { userId: participantId } },
        { userId: participantId, Course: { userId: currentUserId } }
      ]
    }
  }) || await prisma.liveSession.findFirst({
    where: {
      OR: [
        { studentId: currentUserId, teacherId: participantId },
        { studentId: participantId, teacherId: currentUserId }
      ]
    }
  });

  // Admin bypass: Admins can always start conversations (legacy/support)
  const currentUser = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true } });
  
  if (!hasRelationship && currentUser?.role !== "admin") {
    throw new Error("Cannot start conversation: No active enrollment or session relationship found");
  }

  // Try to find existing 1:1 conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      OR: [
        {
          participant1Id: currentUserId,
          participant2Id: participantId,
        },
        {
          participant1Id: participantId,
          participant2Id: currentUserId,
        },
      ],
    },
    include: {
      participant1: {
        select: { id: true, name: true, image: true },
      },
      participant2: {
        select: { id: true, name: true, image: true },
      },
      lastMessage: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      participants: true
    },
  }) as any;

  // Create new conversation if doesn't exist
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        participant1Id: currentUserId,
        participant2Id: participantId,
        isGroup: false,
        participants: {
          create: [
            { userId: currentUserId, isAdmin: true },
            { userId: participantId }
          ]
        }
      } as any,
      include: {
        participant1: {
          select: { id: true, name: true, image: true },
        },
        participant2: {
          select: { id: true, name: true, image: true },
        },
        lastMessage: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        participants: true
      },
    }) as any;
  }

  return conversation;
}

/**
 * Send a new message
 * Works for both 1:1 and Group chats via ConversationParticipant check.
 */
export async function sendMessage(conversationId: string, content: string, messageType: "Text" | "Image" | "File" | "Video" | "Audio" = "Text") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const currentUserId = (session.user as any).id;

  // QA-088: Rate Limiting (Author: Sanket)
  const lastMessage = await prisma.message.findFirst({
      where: { senderId: currentUserId },
      orderBy: { createdAt: "desc" }
  });

  if (lastMessage) {
      const fiveSecondsAgo = new Date(Date.now() - 5 * 1000);
      if (lastMessage.createdAt > fiveSecondsAgo) {
          throw new Error("You are sending messages too quickly. Please wait a moment.");
      }
  }

  // Verify user is part of the conversation via Participant table
  const participation = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
    include: {
      conversation: true
    }
  });

  if (!participation) {
    throw new Error("Conversation not found or access denied");
  }

  const conversation = participation.conversation as any;

  // Determine receiver ID (only for 1:1 chats for legacy support/indexing)
  let receiverId = null;
  if (!conversation.isGroup) {
      receiverId = conversation.participant1Id === currentUserId
        ? conversation.participant2Id
        : conversation.participant1Id;
  }

  // Create the message
  const message = await prisma.message.create({
    data: {
      senderId: currentUserId,
      receiverId,
      conversationId,
      content,
      messageType,
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // Update conversation's last message and activity
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageId: message.id,
      lastActivity: new Date(),
    },
  });

  // Create notification for receiver (only for 1:1 chats)
  if (receiverId) {
    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: "New Message",
        message: `You have a new message from ${message.sender.name || "Someone"}`,
        type: "Message",
        data: { senderId: currentUserId, conversationId }
      }
    });
  }

  revalidatePath("/dashboard/messages");
  return message;
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string, page: number = 1, limit: number = 50) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const currentUserId = (session.user as any).id;

  // Verify user is part of the conversation
  const participation = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!participation) {
    throw new Error("Conversation not found or access denied");
  }

  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    include: {
      sender: {
        select: { id: true, name: true, image: true },
      },
      replies: {
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  }) as any[];

  return messages.reverse(); // Return in chronological order
}

/**
 * Get current user's conversations (including groups)
 */
export async function getUserConversations(userId?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  let currentUserId = (session.user as any).id;

  // QA-086: Messaging IDOR Fix (Author: Sanket)
  // If a specific userId is requested, ensure it matches current user OR requester is admin
  if (userId && userId !== currentUserId) {
      const requester = await prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true } });
      if (requester?.role !== "admin") {
          console.warn(`[SECURITY] User ${currentUserId} attempted to fetch conversations for user ${userId}`);
          throw new Error("Unauthorized: You can only view your own conversations");
      }
      currentUserId = userId; // Admin can view others
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: currentUserId
        }
      }
    },
    include: {
      participant1: {
        select: { id: true, name: true, image: true },
      },
      participant2: {
        select: { id: true, name: true, image: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, image: true }
          }
        }
      },
      lastMessage: {
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: { lastActivity: "desc" },
  }) as any[];

  // Calculate meta info for UI
  const conversationsWithData = conversations.map((conv: any) => {
    let otherParticipant = null;
    let displayName = conv.title || "Group Chat";
    let displayImage = null;

    if (!conv.isGroup) {
      otherParticipant = conv.participant1Id === currentUserId
        ? conv.participant2
        : conv.participant1;
      
      displayName = otherParticipant?.name || "Deleted User";
      displayImage = otherParticipant?.image || null;
    }

    return {
      ...conv,
      otherParticipant,
      displayName,
      displayImage,
      unreadCount: conv._count?.messages || 0,
    };
  });

  return conversationsWithData;
}

/**
 * Mark messages as read for current user
 */
export async function markMessagesAsRead(conversationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const currentUserId = (session.user as any).id;

  // Verify participation
  const participation = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: currentUserId,
      },
    },
  });

  if (!participation) {
    throw new Error("Conversation not found or access denied");
  }

  // Mark all unread messages where the current user is NOT the sender
  // In a participant-based system, 'receiverId' is less useful for unread,
  // but we'll stick to legacy receiverId check if available, or just senderId != current
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  revalidatePath("/dashboard/messages");
}

/**
 * Search users to start new 1:1 conversations
 */
export async function searchUsersForChat(query: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const currentUserId = (session.user as any).id;

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      image: true,
      // email stripped for PII protection - Author: Sanket
      teacherProfile: {
        select: {
          bio: true,
          expertise: true,
        },
      },
    },
    take: 10,
  });

  return users;
}