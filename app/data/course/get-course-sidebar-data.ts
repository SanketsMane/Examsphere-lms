import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

export async function getCourseSidebarData(slug: string) {
  const session = await getSessionWithRole();

  if (!session) {
    return redirect("/login");
  }

  const course = await prisma.course.findUnique({
    where: {
      slug: slug,
    },
    select: {
      id: true,
      title: true,
      fileKey: true,
      duration: true,
      level: true,
      category: true,
      slug: true,
      userId: true, // Need to check ownership
      chapter: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              title: true,
              position: true,
              description: true,
              lessonProgress: {
                where: {
                  userId: session.user.id,
                },
                select: {
                  completed: true,
                  lessonId: true,
                  id: true,
                },
              },
            },
          },
          quizzes: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              title: true,
              passingScore: true,
              attempts: {
                where: {
                  userId: session.user.id,
                },
                select: {
                  id: true,
                  passed: true,
                  percentage: true,
                  status: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
                take: 1, // Get only the latest attempt
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return notFound();
  }

  // Allow access if user is admin or course owner
  if (session.user.role === "admin" || course.userId === session.user.id) {
    return { course };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: course.id,
      },
    },
  });

  if (!enrollment || enrollment.status !== "Active") {
    return notFound();
  }

  return {
    course,
  };
}

export type CourseSidebarDataType = Awaited<
  ReturnType<typeof getCourseSidebarData>
>;
