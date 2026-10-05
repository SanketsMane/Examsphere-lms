"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const user = await requireUser();
  if (!user) {
    return { status: "error", message: "Please sign in again" };
  }

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { Chapter: { select: { courseId: true, Course: { select: { userId: true } } } } },
    });

    if (!lesson) {
      return { status: "error", message: "Lesson not found" };
    }

    // Progress may only be recorded by someone who can actually open the lesson,
    // mirroring the access check in getLessonContent.
    const isOwnerOrAdmin =
      user.role === "admin" || lesson.Chapter.Course.userId === user.id;

    if (!isOwnerOrAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: user.id, courseId: lesson.Chapter.courseId },
        },
        select: { status: true },
      });

      if (enrollment?.status !== "Active") {
        return { status: "error", message: "You are not enrolled in this course" };
      }
    }

    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: user.id,
        completed: true,
      },
    });

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: "Progress updated",
    };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}
