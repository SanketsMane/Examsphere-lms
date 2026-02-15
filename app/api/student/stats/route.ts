import { NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser(false);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Enrolled Courses Count
    const enrolledCoursesCount = await prisma.enrollment.count({
      where: { 
        userId: user.id,
        status: "Active" // Active means paid enrollment
      }
    });

    // 2. Completed Lessons Count
    const completedLessonsCount = await prisma.lessonProgress.count({
      where: {
        userId: user.id,
        completed: true
      }
    });

    // 3. Upcoming Exams (Quizzes in enrolled courses not yet attempted)
    // First get course IDs student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id, status: "Active" },
      select: { courseId: true }
    });
    const courseIds = enrollments.map(e => e.courseId);

    const upcomingExamsCount = await prisma.quiz.count({
      where: {
        courseId: { in: courseIds },
        attempts: {
          none: {
            userId: user.id
          }
        }
      }
    });

    // 4. Upcoming Sessions (Live Sessions student is part of)
    const upcomingSessionsCount = await prisma.liveSession.count({
      where: {
        OR: [
          { studentId: user.id },
          { bookings: { some: { studentId: user.id } } }
        ],
        status: "scheduled",
        scheduledAt: { gte: new Date() }
      }
    });

    // 5. Overall Progress (Mean progress across all enrolled courses)
    // This is a bit more complex, for now let's return a simple sum/count ratio or use StudentProgress if available
    const studentProgressRecord = await prisma.studentProgress.findUnique({
      where: { studentId: user.id }
    });

    const stats = {
      enrolledCourses: enrolledCoursesCount,
      completedLessons: completedLessonsCount,
      upcomingExams: upcomingExamsCount,
      upcomingSessions: upcomingSessionsCount,
      overallProgress: studentProgressRecord?.attendedSessions ? Math.round((studentProgressRecord.attendedSessions / (studentProgressRecord.totalSessions || 1)) * 100) : 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[STUDENT_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
