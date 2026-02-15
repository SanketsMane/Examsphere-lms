import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

export async function getLessonContent(lessonId: string) {
  const session = await getSessionWithRole();

  if (!session) {
    return redirect("/login");
  }

  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailKey: true,
      videoKey: true,
      position: true,
      lessonProgress: {
        where: {
          userId: session.user.id,
        },
        select: {
          completed: true,
          lessonId: true,
        },
      },
      Chapter: {
        select: {
          courseId: true,
          Course: {
            select: {
              id: true,
              title: true,
              slug: true,
              userId: true, // Select userId to check ownership
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  // Check access: Allow if user is admin, course owner, or enrolled student
  const isAuthorized = 
    session.user.role === "admin" || 
    lesson.Chapter.Course.userId === session.user.id;

  if (!isAuthorized) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.Chapter.courseId,
        },
      },
      select: {
        status: true,
      },
    });

    if (!enrollment || enrollment.status !== "Active") {
      notFound();
    }
  }

  // Get all lessons in the course to find the next one
  const allChapters = await prisma.chapter.findMany({
    where: {
      courseId: lesson.Chapter.courseId,
    },
    orderBy: {
      position: "asc",
    },
    select: {
      lessons: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
        },
      },
    },
  });

  const allLessonIds = allChapters.flatMap((chapter) =>
    chapter.lessons.map((l) => l.id)
  );

  const currentIndex = allLessonIds.indexOf(lesson.id);
  const nextLessonId =
    currentIndex !== -1 && currentIndex < allLessonIds.length - 1
      ? allLessonIds[currentIndex + 1]
      : null;

  return {
    ...lesson,
    nextLessonId,
  };
}

export type LessonContentType = Awaited<ReturnType<typeof getLessonContent>>;
