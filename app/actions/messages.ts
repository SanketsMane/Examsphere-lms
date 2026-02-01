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
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const currentUserId = session.user.id;

  // Don't create conversation with yourself
  if (currentUserId === participantId) {
    throw new Error("Cannot create conversation with yourself");
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
  });

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
    });
  }

  return conversation;
}

/**
 * Send a new message
 * Works for both 1:1 and Group chats via ConversationParticipant check.
 */
export async function sendMessage(conversationId: string, content: string, messageType: "Text" | "Image" | "File" | "Video" | "Audio" = "Text") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const currentUserId = session.user.id;

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

  const conversation = participation.conversation;

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

  revalidatePath("/dashboard/messages");
  return message;
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(conversationId: string, page: number = 1, limit: number = 50) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const currentUserId = session.user.id;

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
  });

  return messages.reverse(); // Return in chronological order
}

/**
 * Get current user's conversations (including groups)
 */
export async function getUserConversations(userId?: string) {
  let currentUserId = userId;

  if (!currentUserId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      redirect("/sign-in");
    }
    currentUserId = session.user.id;
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
          messages: {
            where: {
              receiverId: currentUserId,
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: { lastActivity: "desc" },
  });

  // Calculate meta info for UI
  const conversationsWithData = conversations.map((conv) => {
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
      unreadCount: conv._count.messages,
    };
  });

  return conversationsWithData;
}

/**
 * Mark messages as read for current user
 */
export async function markMessagesAsRead(conversationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const currentUserId = session.user.id;

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
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const currentUserId = session.user.id;

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
      email: true,
      image: true,
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