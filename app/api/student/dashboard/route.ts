import { NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireUser(false);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    // 1. RESUME LEARNING (Last accessed lesson)
    const lastProgress = await prisma.lessonProgress.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        Lesson: {
          include: {
            Chapter: {
              include: {
                Course: true
              }
            }
          }
        }
      }
    });

    let heroData = null;
    if (lastProgress && lastProgress.Lesson && lastProgress.Lesson.Chapter && lastProgress.Lesson.Chapter.Course) {
      const course = lastProgress.Lesson.Chapter.Course;
      // Calculate course progress (simplified)
      // Note: Relation name is 'Chapter' based on schema
      const totalLessons = await prisma.lesson.count({
        where: { Chapter: { courseId: course.id } }
      });
      const completedLessons = await prisma.lessonProgress.count({
        where: { 
          userId, 
          completed: true, 
          Lesson: { Chapter: { courseId: course.id } } 
        }
      });
      
      heroData = {
        type: 'resume',
        data: {
          id: course.id,
          title: course.title,
          lessonId: lastProgress.Lesson.id,
          lessonTitle: lastProgress.Lesson.title,
          fileKey: course.fileKey, // Matches Course type 'fileKey'
          slug: course.slug,
          progress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
          lastChapter: lastProgress.Lesson.Chapter.title,
          // Fill mandatory Course fields to satisfy frontend types (even if mostly unused in Hero)
          description: course.description,
          smallDescription: course.smallDescription,
          price: course.price,
          duration: course.duration,
          level: course.level,
          category: course.category,
        }
      };
    } else {
      // Fallback: Welcome / Start Path
      heroData = {
        type: 'welcome',
        data: null
      };
    }

    // 2. URGENT ACTIONS (Live Sessions + Exams)
    const now = new Date();
    const upcomingSessions = await prisma.liveSession.findMany({
      where: {
        OR: [
          { studentId: userId },
          { bookings: { some: { studentId: userId } } }
        ],
        status: "scheduled",
        scheduledAt: { gte: now }
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
      include: {
        teacher: {
          include: { user: true }
        }
      }
    });

    // Exams (Enrolled courses with quizzes not attempted)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId, status: "Active" },
      select: { courseId: true }
    });
    const courseIds = enrollments.map(e => e.courseId);

    const pendingQuizzes = await prisma.quiz.findMany({
      where: {
        courseId: { in: courseIds },
        attempts: { none: { userId } }
      },
      take: 3,
      include: { course: true } // Lowercase relation name 'course'
    });

    // Combine and Sort
    const urgentItems = [
      ...upcomingSessions.map(session => ({
        id: `session-${session.id}`,
        type: 'live_session',
        title: session.title,
        subtitle: session.teacher?.user?.name ? `with ${session.teacher.user.name}` : 'Live Class',
        timestamp: session.scheduledAt,
        actionUrl: `/(student)/(drawer)/sessions?id=${session.id}`
      })),
      ...pendingQuizzes.map(quiz => ({
        id: `exam-${quiz.id}`,
        type: 'exam',
        title: quiz.title,
        subtitle: quiz.course?.title || 'Course Quiz',
        timestamp: quiz.createdAt, // Fallback as quizzes might not have 'dueDate'
        actionUrl: `/(student)/(drawer)/(tabs)/exams?id=${quiz.id}`
      }))
    ].sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).slice(0, 5);


    // 3. PROGRESS & STREAK
    // Calculate streak: Count distinct dates in LessonProgress updated_at in last 30 days
    const activity = await prisma.lessonProgress.findMany({
      where: { userId, updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { updatedAt: true }
    });
    
    // Quick distinct count (converting to date string)
    const uniqueDays = new Set(activity.map(a => new Date(a.updatedAt).toDateString())).size;
    
    // Total Hours (Mocked or from StudentProgress)
    const studentProgress = await prisma.studentProgress.findUnique({ where: { studentId: userId } });
    const enrolledCoursesCount = await prisma.enrollment.count({ where: { userId, status: "Active" } });

    // 4. RECOMMENDATIONS
    const recommendations = await prisma.course.findMany({
      where: { 
        id: { notIn: courseIds },
        status: "Draft" // changed to Draft for dev env? Or Published? Usually Published.
      },
      take: 5,
      // orderBy: { totalStudents: 'desc' } // totalStudents might not exist in sort index, let's just take 5
    });

    // 5. LAYOUT CONFIG
    const layout = [
      { id: 'hero_resume', priority: 1, visible: true },
      { id: 'urgent_actions', priority: 2, visible: urgentItems.length > 0 },
      { id: 'progress_stats', priority: 3, visible: true },
      { id: 'quick_actions', priority: 4, visible: true },
      { id: 'mentorship', priority: 5, visible: true },
      { id: 'recommendations', priority: 6, visible: true },
    ];

    return NextResponse.json({
      hero: heroData,
      urgent: urgentItems,
      stats: {
        streak: uniqueDays,
        hoursLearned: Math.round(studentProgress?.totalHours || 0),
        completionRate: studentProgress ? Math.round((studentProgress.coursesCompleted / (enrolledCoursesCount || 1)) * 100) : 0
      },
      recommendations,
      layout
    });

  } catch (error) {
    console.error("[DASHBOARD_API]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
