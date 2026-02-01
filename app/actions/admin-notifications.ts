"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type BroadcastRecipients = "all" | "students" | "teachers" | "admins";

interface BroadcastData {
  title: string;
  message: string;
  recipients: BroadcastRecipients;
}

export async function sendBroadcast(data: BroadcastData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user;

    if (!user || (user as any).role !== "admin") {
      return { error: "Unauthorized" };
    }

    let whereClause: any = {};

    switch (data.recipients) {
      case "students":
        whereClause = { role: "student" };
        break;
      case "teachers":
        whereClause = { role: "teacher" };
        break;
      case "admins":
        whereClause = { role: "admin" };
        break;
      case "all":
      default:
        whereClause = {}; // No filter, select all
        break;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    if (users.length === 0) {
      return { error: "No recipients found for this selection." };
    }

    const notifications = users.map((u) => ({
      userId: u.id,
      title: data.title,
      message: data.message,
      type: "System" as NotificationType,
      isRead: false,
    }));

    // Create notifications in batches to avoid huge queries
    // Prisma createMany is efficient but let's be safe with chunking if needed
    // For now, simple createMany is fine for reasonable user counts
    await prisma.notification.createMany({
      data: notifications,
    });

    revalidatePath("/admin/notifications");
    return { success: true, count: users.length };
  } catch (error) {
    console.error("Broadcast Error:", error);
    return { error: "Failed to send notifications" };
  }
}
