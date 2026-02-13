import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Get user notifications with pagination
export async function getUserNotifications(page: number = 1, limit: number = 20, filter?: "all" | "unread" | "read") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const currentUserId = session.user.id;

  const skip = (page - 1) * limit;
  const where: any = {
    userId: currentUserId,
  };

  if (filter === "unread") {
    where.isRead = false;
  } else if (filter === "read") {
    where.isRead = true;
  }

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        userId: currentUserId,
        isRead: false,
      },
    }),
  ]);

  return {
    notifications,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    totalCount,
    unreadCount,
  };
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  revalidatePath("/dashboard/notifications");
  return { success: true };
}

// Create system notification
export async function createSystemNotification(
  userId: string,
  title: string,
  message: string,
  type: "System" | "Course" | "Session" | "Payment" | "Review" | "Message" = "System",
  metadata?: any
) {
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data: metadata,
    },
  });

  // In a real app, you might also trigger push notifications here
  revalidatePath("/dashboard/notifications");
}

// Create course enrollment notification
export async function createCourseNotification(userId: string, courseId: string, action: "enrolled" | "completed" | "updated") {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) return;

  const notifications = {
    enrolled: {
      title: "Course Enrollment Confirmed",
      message: `You've successfully enrolled in "${course.title}". Start learning now!`,
    },
    completed: {
      title: "Course Completed! 🎉",
      message: `Congratulations! You've completed "${course.title}". Your certificate is ready.`,
    },
    updated: {
      title: "Course Updated",
      message: `"${course.title}" has new content available. Check it out!`,
    },
  };

  const notification = notifications[action];

  await createSystemNotification(
    userId,
    notification.title,
    notification.message,
    "Course",
    { courseId, action }
  );
}

// Create session notification
export async function createSessionNotification(
  userId: string,
  sessionId: string,
  action: "booked" | "reminder" | "started" | "completed" | "cancelled"
) {
  const session = await prisma.liveSession.findUnique({
    where: { id: sessionId },
    include: {
      teacher: true,
    },
  });

  if (!session) return;

  const notifications = {
    booked: {
      title: "Session Booked Successfully",
      message: `Your session with ${(session as any).teacher.name} has been confirmed for ${new Date(session.scheduledAt).toLocaleDateString()}.`,
    },
    reminder: {
      title: "Session Starting Soon",
      message: `Your session with ${(session as any).teacher.name} starts in 15 minutes. Get ready!`,
    },
    started: {
      title: "Session Started",
      message: `Your session with ${(session as any).teacher.name} has started. Join now!`,
    },
    completed: {
      title: "Session Completed",
      message: `Your session with ${(session as any).teacher.name} has ended. Don't forget to leave a review!`,
    },
    cancelled: {
      title: "Session Cancelled",
      message: `The session "${session.title}" on ${new Date(session.scheduledAt).toLocaleDateString()} has been cancelled.`,
    },
  };

  const notification = notifications[action];

  await createSystemNotification(
    userId,
    notification.title,
    notification.message,
    "Session",
    { sessionId, action }
  );
  
  // Revalidate relevant paths
  revalidatePath("/dashboard/sessions");
  revalidatePath("/teacher/sessions");
}

// Create payment notification
export async function createPaymentNotification(
  userId: string,
  action: "success" | "failed" | "refund",
  amount: number,
  description: string
) {
  const notifications = {
    success: {
      title: "Payment Successful",
      message: `Your payment of $${(amount / 100).toFixed(2)} for ${description} has been processed.`,
    },
    failed: {
      title: "Payment Failed",
      message: `Your payment of $${(amount / 100).toFixed(2)} for ${description} could not be processed.`,
    },
    refund: {
      title: "Refund Processed",
      message: `Your refund of $${(amount / 100).toFixed(2)} for ${description} has been processed.`,
    },
  };

  const notification = notifications[action];

  await createSystemNotification(
    userId,
    notification.title,
    notification.message,
    "Payment",
    { amount, description, action }
  );
}

// Create message notification
export async function createMessageNotification(userId: string, senderId: string, conversationId: string) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
  });

  if (!sender) return;

  await createSystemNotification(
    userId,
    "New Message",
    `You have a new message from ${sender.name}`,
    "Message",
    { senderId, conversationId }
  );
}

// Get notification preferences
export async function getNotificationPreferences() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // This would typically come from a user preferences table
  // For now, return default preferences
  return {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    notificationTypes: {
      system: true,
      course: true,
      session: true,
      payment: true,
      review: true,
      message: true,
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },
  };
}

// Update notification preferences
export async function updateNotificationPreferences(preferences: any) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // In a real implementation, you'd save these to a user preferences table
  // For now, we'll just return success
  return { success: true };
}