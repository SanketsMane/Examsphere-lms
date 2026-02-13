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
import { createSystemNotification } from "@/app/actions/notifications";
import { sendCourseSubmissionEmail } from "@/lib/email-notifications";

export async function editCourse(
  data: CourseSchemaType,
  courseId: string
): Promise<ApiResponse> {
  const session = await requireTeacher();
  const user = session.user as any;

  // Check if teacher is trying to edit their own course
  if (user.role === "teacher") {
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
    // Apply security protection for admin actions
    /*
    const securityCheck = await protectAdminAction(user.id);
    if (!securityCheck.success) {
      return {
        status: "error",
        message: securityCheck.error || "Security check failed",
      };
    }
    */

    const result = courseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const whereClause: any = {
      id: courseId,
    };

    // If teacher, ensure they own the course
    if (user.role === "teacher") {
      whereClause.userId = user.id;
    }

    // Approval Logic: If teacher tries to Publish, set to Pending unless Admin
    let statusToSave = result.data.status;
    let message = "Course updated successfully";

    if (user.role === "teacher" && result.data.status === "Published") {
      statusToSave = "Pending";
      message = "Course submitted for approval";

      // Notify Admins
      const admins = await prisma.user.findMany({
        where: { role: "admin" },
        select: { id: true }
      });

      const courseTitle = result.data.title || "A course"; // Title might not be in payload if not updating it, need to handle that.
      // Wait, result.data is partial? courseSchema.safeParse(data). 
      // strict() is not on z.object usually unless specified. 
      // If title is missing in update data, we might need to fetch it or just say "A course".
      // But usually edit page sends full data? let's check schema.

      // Better to fetch course title if not in data, but let's assume valid data for now or generic message.
      // actually, let's just say "A new course has been submitted".
      // Or better, fetch the course to get the title if needed, but we are updating it.
      // If title is in result.data, use it. If not, fetch it.

      // Let's keep it simple for now to avoid extra DB calls if possible, but for notification quality we want title.
      // We are updating the course, so result.data might have it. 
      // If not, we can use "New Course Submission".

      for (const admin of admins) {
        await createSystemNotification(
          admin.id,
          "New Course Submission",
          `Teacher ${user.name || "Unknown"} has submitted a course for review.`,
          "Course",
          { courseId: courseId, action: "submission" }
        );
      }
    }

    // QA-061: Prevent teacher self-promotion (Author: Sanket)
    const dataToSave: any = {
      ...result.data,
      description: result.data.description ? DOMPurify.sanitize(result.data.description) : result.data.description,
      smallDescription: result.data.smallDescription ? DOMPurify.sanitize(result.data.smallDescription) : result.data.smallDescription,
      status: statusToSave as any,
    };

    if (user.role === "teacher") {
      delete dataToSave.isFeatured;
    }

    await prisma.course.update({
      where: whereClause,
      data: dataToSave,
    });



    // Fetch slug for revalidation if needed, or rely on just home/search
    // Ideally we should have the slug from the update result or existing data
    const updatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true }
    });

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/browse");
    if (updatedCourse?.slug) {
      revalidatePath(`/courses/${updatedCourse.slug}`);
    }

    return {
      status: "success",
      message: message,
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update Course",
    };
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
  try {
    const course = await prisma.course.findUnique({
        where: {
            id: courseId,
            userId: session.user.id,
        },
        select: {
            id: true,
            title: true,
            price: true,
            status: true,
        },
    });

    if (!course) {
        throw new Error("Course not found");
    }

    // Determine new status based on price
    // Free courses (price = 0) are auto-approved
    // Paid courses require admin review
    const isFree = course.price === 0;
    const newStatus = isFree ? "Published" : "Pending";

    // Update course status
    await prisma.course.update({
        where: { id: courseId },
        data: { status: newStatus as any },
    });

    // Only notify admins for paid courses
    if (!isFree && newStatus === "Pending") {
      // Notify Admins
      const admins = await prisma.user.findMany({
        where: { role: "admin" },
        select: { id: true, email: true }
      });

      for (const admin of admins) {
        await createSystemNotification(
          admin.id,
          "New Course Submission",
          `Teacher ${session.user.name || "Unknown"} has submitted "${course.title}" for review.`,
          "Course",
          { courseId: courseId, action: "submission" }
        );

        // Send Email
        if (admin.email) {
          await sendCourseSubmissionEmail(
            admin.email,
            course.title,
            session.user.name || "Unknown",
            session.user.email || "No Email",
            courseId
          );
        }
      }
    }

    revalidatePath(`/teacher/courses/${courseId}/edit`);
    revalidatePath("/teacher/courses");

    // Send Course Published Email (Author: Sanket)
    if (newStatus === "Published") {
        try {
            const { sendTemplatedEmail } = await import("@/lib/email");
            if (session.user.email) {
                await sendTemplatedEmail(
                    "coursePublished",
                    session.user.email,
                    "Your Course is Live! 🚀",
                    {
                        userName: session.user.name || "Teacher",
                        courseTitle: course.title,
                        courseUrl: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}` // Ideally Slug
                    }
                );
            }
        } catch (e) {
            console.error("Failed to send course published email", e);
        }
    }

    return {
        status: "success",
        message: isFree
            ? "Free course published successfully!"
            : "Course submitted for admin review."
    };
}
  catch (error) {
    return { status: "error", message: "Failed to update status" };
  }
}
