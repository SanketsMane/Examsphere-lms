"use server";

import { requireTeacher } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import DOMPurify from "isomorphic-dompurify";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchemaType,
  courseSchema,
  CourseSchemaType,
  lessonSchema,
  LessonSchemaType,
} from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import {
  buildCourseData,
  getTeacherAuthoringBlock,
  handleCourseWriteError,
  teacherCourseSchema,
  toFieldErrors,
} from "@/lib/course-write";
import { assertValidCategory } from "@/lib/course-categories";
import { createSystemNotification } from "@/app/actions/notifications";
import { sendCourseSubmissionEmail } from "@/lib/email-notifications";

/**
 * Save course details. Publication state is never changed here — a teacher submits
 * for review only through publishCourse (CourseActions), so fixing a typo on a
 * published course doesn't pull it off the site.
 */
export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();
  const user = session.user as any;
  const isAdmin = user.role === "admin";

  const authoringBlock = await getTeacherAuthoringBlock({ id: user.id, role: user.role });
  if (authoringBlock) {
    return { status: "error", message: authoringBlock };
  }

  if (!isAdmin) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true }
    });

    if (!course || course.userId !== session.user.id) {
      return {
        status: "error",
        message: "You can only edit your own courses"
      };
    }
  }

  try {
    // This form never carries status/isFeatured (admins change those from the admin console).
    const result = teacherCourseSchema.safeParse(data);

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

    const whereClause: any = { id: courseId };
    if (!isAdmin) {
      whereClause.userId = user.id;
    }

    // QA-061: teachers cannot promote their own course. buildCourseData writes an
    // explicit column list and leaves status/isFeatured untouched when not passed.
    const dataToSave = buildCourseData(result.data, {}, { partial: true });

    const updatedCourse = await prisma.course.update({
      where: whereClause,
      data: dataToSave,
      select: { slug: true },
    });

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/browse");
    revalidatePath(`/teacher/courses/${courseId}/edit`);
    if (updatedCourse?.slug) {
      revalidatePath(`/courses/${updatedCourse.slug}`);
    }

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (error) {
    return handleCourseWriteError(error, {
      action: "teacher.editCourse",
      userId: user.id,
      slug: (data as any)?.slug,
    });
  }
}

export async function reorderLessons(
  chapterId: string,
  lessons: { id: string; position: number }[],
  courseId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();
  const user = session.user as any;

  // QA-016: IDOR - Verify course ownership before reordering lessons
  if (user.role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true }
    });

    if (!course || course.userId !== session.user.id) {
      return {
        status: "error",
        message: "Unauthorized: You do not own this course"
      };
    }
  }

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

    // QA-063: Verify chapter belongs to the authorized course (Author: Sanket)
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId, courseId: courseId }
    });
    if (!chapter) throw new Error("Chapter not found in this course");

    await prisma.$transaction(updates);

    revalidatePath(`/teacher/courses/${courseId}/edit`);

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
  const session = await requireTeacher();
  const user = session.user as any;

  // QA-016: IDOR - Verify course ownership before reordering chapters
  if (user.role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true }
    });

    if (!course || course.userId !== session.user.id) {
      return {
        status: "error",
        message: "Unauthorized: You do not own this course"
      };
    }
  }

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

    // QA-066: Verify chapters belong to the authorized course (Author: Sanket)
    const chapterCheck = await prisma.chapter.findFirst({
      where: { id: chapters[0].id, courseId: courseId }
    });
    if (!chapterCheck) throw new Error("Chapters not found in this course");

    await prisma.$transaction(updates);

    revalidatePath(`/teacher/courses/${courseId}/edit`);

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
  const session = await requireTeacher();
  const user = session.user as any;

  // QA-016: IDOR - Verify course ownership before creating chapter
  if (user.role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: values.courseId },
      select: { userId: true }
    });

    if (!course || course.userId !== session.user.id) {
      return {
        status: "error",
        message: "Unauthorized: You do not own this course"
      };
    }
  }

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

    revalidatePath(`/teacher/courses/${result.data.courseId}/edit`);

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
  values: LessonSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  const user = session.user as any;

  // QA-016: IDOR - Verify course ownership before creating lesson
  if (user.role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: values.courseId, userId: session.user.id }
    });

    if (!course) {
      return {
        status: "error",
        message: "Unauthorized: You do not own this course or course not found"
      };
    }

    // QA-064: Verify chapter belongs to the course (Author: Sanket)
    const chapter = await prisma.chapter.findUnique({
      where: { id: values.chapterId, courseId: values.courseId }
    });
    if (!chapter) {
      return { status: "error", message: "Chapter not found in this course" };
    }
  }

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid Data",
      };
    }

    // Limit check: Max 50 lessons per course
    const courseLessonCount = await prisma.lesson.count({
      where: { Chapter: { courseId: result.data.courseId } }
    });

    if (courseLessonCount >= 50) {
      return {
        status: "error",
        message: "Course limit reached (Max 50 lessons).",
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
          description: result.data.description ? DOMPurify.sanitize(result.data.description) : result.data.description, // QA-096: XSS Sanitization (Author: Sanket)
          videoKey: result.data.videoKey,
          thumbnailKey: result.data.thumbnailKey,
          videoUrl: result.data.videoUrl, // Save the video URL
          chapterId: result.data.chapterId,
          position: (maxPos?.position ?? 0) + 1,
        },
      });
    });

    revalidatePath(`/teacher/courses/${result.data.courseId}/edit`);

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
  const session = await requireTeacher();
  const user = session.user as any;

  // QA-016: IDOR - Verify course ownership before deleting lesson
  if (user.role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { userId: true }
    });

    if (!course || course.userId !== session.user.id) {
      return {
        status: "error",
        message: "Unauthorized: You do not own this course"
      };
    }
  }

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
        courseId: true,
      },
    });

    if (!chapterWithLessons || chapterWithLessons.courseId !== courseId) {
      return {
        status: "error",
        message: "Chapter not Found or doesn't belong to this course",
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
    revalidatePath(`/teacher/courses/${courseId}/edit`);

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
  const session = await requireTeacher();
  const user = session.user as any;

  // QA-016: IDOR - Verify course ownership before deleting chapter
  if (user.role === "teacher") {
    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: session.user.id }
    });

    if (!course) {
      return {
        status: "error",
        message: "Unauthorized: You do not own this course or course not found"
      };
    }

    // QA-066: Verify chapter belongs to the course (Author: Sanket)
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId, courseId: courseId }
    });
    if (!chapter) {
      return { status: "error", message: "Chapter not found in this course" };
    }
  }

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
    revalidatePath(`/teacher/courses/${courseId}/edit`);

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

export async function publishCourse(courseId: string): Promise<ApiResponse> {
  const session = await requireTeacher();
  const user = session.user as any;

  const authoringBlock = await getTeacherAuthoringBlock({ id: user.id, role: user.role });
  if (authoringBlock) {
    return { status: "error", message: authoringBlock };
  }

  try {
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        _count: { select: { chapter: true } },
        chapter: { select: { _count: { select: { lessons: true } } } },
      },
    });

    if (!course) {
      return { status: "error", message: "Course not found" };
    }

    if (course.status === "Pending") {
      return { status: "error", message: "This course is already awaiting admin review." };
    }

    const lessonCount = course.chapter.reduce((sum, ch) => sum + ch._count.lessons, 0);
    if (lessonCount < 1) {
      return { status: "error", message: "Add at least one lesson before submitting the course for review." };
    }

    // Every teacher course — free or paid — goes through admin review.
    await prisma.course.update({
      where: { id: courseId },
      data: { status: "Pending" },
    });

    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, email: true }
    });

    for (const admin of admins) {
      try {
        await createSystemNotification(
          admin.id,
          "New Course Submission",
          `Teacher ${session.user.name || "Unknown"} has submitted "${course.title}" for review.`,
          "Course",
          { courseId: courseId, action: "submission" }
        );

        if (admin.email) {
          await sendCourseSubmissionEmail(
            admin.email,
            course.title,
            session.user.name || "Unknown",
            session.user.email || "No Email",
            courseId
          );
        }
      } catch (e) {
        console.error("Failed to notify admin about course submission", e);
      }
    }

    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath("/teacher/courses");

    return {
      status: "success",
      message: "Course submitted for admin review."
    };
  } catch (error) {
    console.error("[teacher.publishCourse]", error);
    return { status: "error", message: "Failed to submit course for review" };
  }
}
