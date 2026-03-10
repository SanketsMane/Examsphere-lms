import "server-only";

import { prisma } from "@/lib/db";
import { requireTeacherOrAdmin } from "../auth/require-roles";

export async function adminGetCourses(page: number = 1, pageSize: number = 10) {
  // await new Promise((resolve) => setTimeout(resolve, 2000));

  const session = await requireTeacherOrAdmin();

  // If teacher, only show their own courses
  const whereCondition = session.user.role === "teacher"
    ? { userId: session.user.id }
    : {};

  const skip = (page - 1) * pageSize;

  const [data, totalCount] = await Promise.all([
    prisma.course.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        smallDescription: true,
        duration: true,
        level: true,
        status: true,
        price: true,
        fileKey: true,
        slug: true,
      },
    }),
    prisma.course.count({ where: whereCondition })
  ]);

  return { data, totalCount };
}

export type AdminCourseType = Awaited<ReturnType<typeof adminGetCourses>>['data'][0];
