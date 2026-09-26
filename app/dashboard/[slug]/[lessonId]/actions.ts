"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function markLessonComplete(
  lessonId: string,
  slug: string
): Promise<ApiResponse> {
  const session = await requireUser();

  try {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: true,
      },
      create: {
        lessonId: lessonId,
        userId: session.id,
        completed: true,
      },
    });

    // Check if course is fully completed
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { Chapter: { select: { courseId: true } } }
    });

    let certificateData = null;

    if (lesson?.Chapter?.courseId) {
      const { generateCertificate } = await import("@/app/actions/certificates");
      const certResult = await generateCertificate(lesson.Chapter.courseId);

      if (certResult.status === "success") {
        certificateData = certResult;
      }
    }

    revalidatePath(`/dashboard/${slug}`);

    return {
      status: "success",
      message: certificateData?.status === "success"
        ? "Course completed!"
        : "Progress updated",
      data: certificateData
    };
  } catch (e) {
    console.error(e);
    return {
      status: "error",
      message: "Failed to mark lesson as complete",
    };
  }
}
