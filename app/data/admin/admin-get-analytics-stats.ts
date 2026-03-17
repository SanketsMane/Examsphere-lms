import "server-only";

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetAnalyticsStats() {
  await requireAdmin();

  const [
    totalRevenue,
    totalStudents,
    totalCourses,
    totalEnrollments,
    averageCompletionRate,
    recentActivity,
    topPerformingCourses,
    monthlyStats
  ] = await Promise.all([
    // Calculate total revenue from enrollments
    prisma.enrollment.aggregate({
      _sum: {
        amount: true,
      },
    }),

    // Total unique students (users with enrollments)
    prisma.user.count({
      where: {
        enrollment: {
          some: {},
        },
      },
    }),

    // Total courses
    prisma.course.count(),

    // Total enrollments
    prisma.enrollment.count(),

    // Average completion rate (lessons completed vs total lessons)
    prisma.$queryRaw`
      SELECT 
        COALESCE(
          (COUNT(CASE WHEN completed = 1 THEN 1 END) / 
           NULLIF(COUNT(id), 0)) * 100, 
          0
        ) as completion_rate
      FROM LessonProgress
    ` as Promise<{ completion_rate: number }[]>,

    // Recent activity (last 10 enrollments)
    prisma.enrollment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: { name: true, email: true }
        },
        Course: {
          select: { title: true }
        }
      }
    }),

    // Top performing courses (by enrollment count)
    prisma.course.findMany({
      take: 5,
      orderBy: {
        enrollment: {
          _count: "desc"
        }
      },
      include: {
        _count: {
          select: {
            enrollment: true,
            chapter: true
          }
        }
      }
    }),

    // Monthly enrollment stats for the last 12 months
    prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m-01') as month,
        COUNT(*) as enrollments,
        SUM(amount) as revenue
      FROM Enrollment
      WHERE createdAt >= NOW() - INTERVAL 12 MONTH
      GROUP BY month
      ORDER BY month ASC
    ` as Promise<{ month: string; enrollments: bigint; revenue: number }[]>
  ]);

  const completionRate = averageCompletionRate[0]?.completion_rate || 0;

  return {
    totalRevenue: totalRevenue._sum?.amount || 0,
    totalStudents,
    totalCourses,
    totalEnrollments,
    completionRate: Math.round(Number(completionRate)),
    recentActivity: recentActivity.map(activity => ({
      id: activity.id,
      action: "Course Enrollment",
      user: activity.User.name,
      course: activity.Course.title,
      createdAt: activity.createdAt,
    })),
    topPerformingCourses: topPerformingCourses.map(course => ({
      id: course.id,
      title: course.title,
      enrollments: course._count.enrollment,
      chapters: course._count.chapter,
      slug: course.slug,
    })),
    monthlyStats: monthlyStats.map(stat => ({
      month: typeof stat.month === 'string' ? stat.month.slice(0, 7) : new Date(stat.month).toISOString().slice(0, 7), // YYYY-MM format
      enrollments: Number(stat.enrollments),
      revenue: Number(stat.revenue) || 0,
    })),
  };
}

export type AdminAnalyticsType = Awaited<ReturnType<typeof adminGetAnalyticsStats>>;