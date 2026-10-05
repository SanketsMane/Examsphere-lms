"use server";

import { requireAdmin } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  lessonSchema,
  type AdminCourseSchemaType,
  type CourseEditSchemaType,
} from "@/lib/zodSchemas";
import {
  adminCourseSchema,
  buildCourseData,
  handleCourseWriteError,
  toFieldErrors,
} from "@/lib/course-write";
import { assertValidCategory } from "@/lib/course-categories";
import { revalidatePath } from "next/cache";

async function ensureAdmin(): Promise<ApiResponse | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { status: "error", message: "Unauthorized: Admin access required" };
  }
}

// Optional columns the edit form doesn't render. buildCourseData defaults them to
// null/[], so writing them when absent would silently wipe existing values.
const OPTIONAL_COURSE_FIELDS = [
  "language",
  "prerequisites",
  "tags",
  "learningOutcomes",
  "discountPrice",
  "discountExpiry",
  "isFeatured",
] as const;

export async function editCourse(
  data: CourseEditSchemaType | AdminCourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  try {
    const result = adminCourseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Please correct the highlighted fields.",
        fieldErrors: toFieldErrors(result.error),
      };
    }

    const categoryError = await assertValidCategory(result.data.category);
    if (categoryError) {
      return {
        status: "error",
        message: categoryError,
        fieldErrors: { category: categoryError },
      };
    }

    const dataToSave: Record<string, unknown> = buildCourseData(result.data, {
      status: result.data.status,
      isFeatured: result.data.isFeatured,
    });
    for (const key of OPTIONAL_COURSE_FIELDS) {
      if ((data as Record<string, unknown>)?.[key] === undefined) {
        delete dataToSave[key];
      }
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: dataToSave,
      select: { slug: true },
    });

    revalidatePath("/admin/courses");
    revalidatePath("/");
    revalidatePath("/courses");
    revalidatePath(`/courses/${updated.slug}`);

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (error) {
    return handleCourseWriteError(error, {
      action: "admin.editCourse",
      slug: (data as any)?.slug,
    });
  }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;
  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons provided for reordering.",
      };
    }

    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: {
          id: lesson.id,
          chapterId: chapterId,
        },
        data: {
          position: lesson.position,
        },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder lessons.",
    };
  }
}

export async function reorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;
  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters provided for reordering.",
      };
    }

    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          courseId: courseId,
        },
        data: {
          position: chapter.position,
        },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

export async function createChapter(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;
  try {
    const result = chapterSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.chapter.findFirst({
        where: {
          courseId: result.data.courseId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.chapter.create({
        data: {
          title: result.data.name,
          courseId: result.data.courseId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

export async function createLesson(
  values: ChapterSchemaType
): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;
  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    await prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId: result.data.chapterId,
        },
        select: {
          position: true,
        },
        orderBy: {
          position: "desc",
        },
      });

      await tx.lesson.create({
        data: {
          title: result.data.name,
          description: result.data.description,
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to create lesson",
    };
  }
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;
  try {
    const chapterWithLessons = await prisma.chapter.findUnique({
      where: {
        id: chapterId,
      },
      select: {
        lessons: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not Found",
      };
    }

    const lessons = chapterWithLessons.lessons;

    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);

    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found in the chapter.",
      };
    }

    const remainingLessons = lessons.filter((lesson) => lesson.id !== lessonId);

    const updates = remainingLessons.map((lesson, index) => {
      return prisma.lesson.update({
        where: { id: lesson.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.lesson.delete({
        where: {
          id: lessonId,
          chapterId: chapterId,
        },
      }),
    ]);
    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted and positions reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  const denied = await ensureAdmin();
  if (denied) return denied;
  try {
    const courseWithChapters = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        chapter: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not Found",
      };
    }

    const chapters = courseWithChapters.chapter;

    const chapterToDelete = chapters.find((chap) => chap.id === chapterId);

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found in the Course.",
      };
    }

    const remainingChapters = chapters.filter((chap) => chap.id !== chapterId);

    const updates = remainingChapters.map((chap, index) => {
      return prisma.chapter.update({
        where: { id: chap.id },
        data: { position: index + 1 },
      });
    });

    await prisma.$transaction([
      ...updates,
      prisma.chapter.delete({
        where: {
          id: chapterId,
        },
      }),
    ]);
    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted and positions reordered successfully",
    };
  } catch {
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
}
