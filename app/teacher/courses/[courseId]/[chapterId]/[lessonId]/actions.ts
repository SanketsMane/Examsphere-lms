"use server";

import { revalidatePath } from "next/cache";

import { requireTeacherOrAdmin } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";

import DOMPurify from "isomorphic-dompurify";

export async function updateLesson(
  values: LessonSchemaType,
  lessonId: string
): Promise<ApiResponse> {
  const session = await requireTeacherOrAdmin();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { Chapter: { select: { courseId: true, Course: { select: { userId: true } } } } },
    });

    if (!lesson) {
      return { status: "error", message: "Lesson not found" };
    }

    if (session.user.role === "teacher" && lesson.Chapter.Course.userId !== session.user.id) {
      return { status: "error", message: "Unauthorized" };
    }

    await prisma.lesson.update({
      where: {
        id: lessonId,
      },
      data: {
        title: result.data.name,
        description: result.data.description ? DOMPurify.sanitize(result.data.description) : result.data.description, // QA-096: XSS Sanitization (Author: Sanket)
        thumbnailKey: result.data.thumbnailKey,
        videoKey: result.data.videoKey,
        videoUrl: result.data.videoUrl,
      },
    });

    if (lesson.Chapter.courseId) {
      revalidatePath(`/teacher/courses/${lesson.Chapter.courseId}/edit`);
    }

    return {
      status: "success",
      message: "Lesson updated successfully",
    };
  } catch (error: any) {
    console.error("Lesson update error:", error);
    return {
      status: "error",
      message: error.message || "Failed to update lesson",
    };
  }
}
