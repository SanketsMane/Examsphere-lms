import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Get user learning analytics
export async function getUserAnalytics(userId?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const targetUserId = userId || session.user.id;

  // IDOR Protection: Only the user themselves or an admin can view analytics
  if (targetUserId !== session.user.id) {
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    if (requester?.role !== "admin") {
      throw new Error("Unauthorized: Access denied to other user's analytics");
    }
  }

  // Get basic stats
  const [
    enrollmentCount,
    totalLessonsCompleted,
    totalSessionsBooked,
    completedSessions,
    messagesCount,
    blogPostsCount,
    certificatesCount,
  ] = await Promise.all([
    // Enrollment count
    prisma.enrollment.count({
      where: { userId: targetUserId }
    }),

    // Total lessons completed
    prisma.lessonProgress.count({
      where: {
        userId: targetUserId,
        completed: true
      }
    }),

    // Total sessions booked
    prisma.liveSession.count({
      where: { studentId: targetUserId }
    }),

    // Completed sessions
    prisma.liveSession.count({
      where: {
        studentId: targetUserId,
        status: "completed"
      }
    }),

    // Messages sent
    prisma.message.count({
      where: { senderId: targetUserId }
    }),

    // Blog posts authored
    prisma.blogPost.count({
      where: { authorId: targetUserId }
    }),

    // Certificates count
    prisma.certificate.count({
      where: { userId: targetUserId }
    }),
  ]);

  // Get daily activity for the chart (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyActivity = await prisma.lessonProgress.findMany({
    where: {
      userId: targetUserId,
      completed: true,
      updatedAt: { gte: thirtyDaysAgo }
    },
    select: { updatedAt: true }
  });

  // Group by date
  const activityMap: { [key: string]: number } = {};
  // Initialize last 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    activityMap[dateStr] = 0;
  }

  dailyActivity.forEach(item => {
    const dateStr = item.updatedAt.toISOString().split('T')[0];
    if (activityMap[dateStr] !== undefined) {
      activityMap[dateStr]++;
    }
  });

  const activityData = Object.entries(activityMap)
    .map(([date, count]) => ({ date, lessons: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Get recent activity
  const recentActivity = await getRecentActivity(targetUserId);

  // Get learning progress
  const learningProgress = await getLearningProgress(targetUserId);

  // Get engagement metrics
  const engagementMetrics = await getEngagementMetrics(targetUserId);

  const actualCompletedCourses = learningProgress.filter(p => p.progress === 100).length;

  return {
    stats: {
      enrollmentCount,
      completedCourses: actualCompletedCourses,
      totalLessonsCompleted,
      totalSessionsBooked,
      completedSessions,
      messagesCount,
      blogPostsCount,
      certificatesCount,
      completionRate: enrollmentCount > 0 ? Math.round((actualCompletedCourses / enrollmentCount) * 100) : 0,
      sessionCompletionRate: totalSessionsBooked > 0 ? Math.round((completedSessions / totalSessionsBooked) * 100) : 0,
    },
    recentActivity,
    learningProgress,
    engagementMetrics,
    activityData
  };
}

// Get teacher analytics
export async function getTeacherAnalytics() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Check if user is a teacher
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (!teacherProfile) {
    // Redirect to complete teacher profile
    // Author: Sanket
    redirect("/register/teacher");
  }

  const [
    coursesCreated,
    totalEnrollments,
    totalEarnings,
    sessionsCompleted,
    averageRating,
    studentsCount,
    blogPostsCount,
    topReview,
    pendingPayouts,
    upcomingSessions,
  ] = await Promise.all([
    // Courses created
    prisma.course.count({
      where: { userId: session.user.id }
    }),

    // Total enrollments across all courses
    prisma.enrollment.count({
      where: {
        Course: {
          userId: session.user.id
        }
      }
    }),

    // Total earnings (simplified calculation)
    prisma.enrollment.aggregate({
      where: {
        Course: {
          userId: session.user.id
        }
      },
      _sum: {
        amount: true
      }
    }),

    // Sessions completed
    prisma.liveSession.count({
      where: {
        teacherId: session.user.id,
        status: "completed"
      }
    }),

    // Average rating
    prisma.review.aggregate({
      where: {
        course: {
          userId: session.user.id
        }
      },
      _avg: {
        rating: true
      }
    }),

    // Unique students
    prisma.enrollment.findMany({
      where: {
        Course: {
          userId: session.user.id
        }
      },
      select: {
        userId: true
      },
      distinct: ["userId"]
    }),

    // Blog posts
    prisma.blogPost.count({
      where: { authorId: session.user.id }
    }),

    // Top Review
    prisma.review.findFirst({
      where: {
        OR: [
          { course: { userId: session.user.id } },
          { teacher: { userId: session.user.id } }
        ],
        rating: 5
      },
      orderBy: { createdAt: "desc" },
      include: {
        reviewer: {
          select: { name: true, image: true }
        }
      }
    }),

    // Pending Payouts
    prisma.payoutRequest.aggregate({
      where: {
        teacherId: teacherProfile.id,
        status: {
          in: ["Pending", "UnderReview", "Approved", "Processing"]
        }
      },
      _sum: {
        requestedAmount: true
      }
    }),

    // Upcoming Sessions
    prisma.liveSession.count({
      where: {
        teacherId: session.user.id,
        status: "scheduled",
        scheduledAt: {
          gte: new Date()
        }
      }
    })
  ]);

  // Execute helpers in parallel
  const [revenueData, coursePerformance] = await Promise.all([
    getRevenueOverTime(session.user.id),
    getCoursePerformance(session.user.id)
  ]);

  return {
    stats: {
      coursesCreated,
      totalEnrollments,
      totalEarnings: totalEarnings._sum.amount || 0,
      sessionsCompleted,
      averageRating: averageRating._avg.rating || 0,
      studentsCount: studentsCount.length,
      blogPostsCount,
      pendingPayouts: pendingPayouts._sum.requestedAmount || 0,
      upcomingSessions
    },
    revenueData,
    coursePerformance,
    topReview,
  };
}

// Get platform analytics (admin only)
export async function getPlatformAnalytics() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue,
    totalSessions,
    totalBlogPosts,
    activeUsers,
    liveSessions,
    pendingPayouts,
      totalFreeSessions,
      freeDemosUsed,
      freeGroupsUsed,
    ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.enrollment.aggregate({
      _sum: { amount: true }
    }),
    prisma.liveSession.count(),
    prisma.blogPost.count(),
    // Active users (users with activity in last 30 days)
    prisma.user.count({
      where: {
        OR: [
          {
            enrollment: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          },
          {
            sentMessages: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              }
            }
          }
        ]
      }
    }),

    // Live Sessions ("Live Now" or just Active today)
    prisma.liveSession.count({
      where: {
        status: "in_progress"
      }
    }),

    // Total Pending Payouts
    prisma.payoutRequest.aggregate({
      where: {
        status: {
          in: ["Pending", "UnderReview", "Processing"]
        }
      },
      _sum: {
        requestedAmount: true
      }
    }),
    
    // Total Free Sessions
    prisma.liveSession.count({
        where: { price: 0 }
    }),

    // Free Demos Used
    prisma.freeClassUsage.count({
        where: { demoUsed: true }
    }),

    // Free Groups Used
    prisma.freeClassUsage.count({
        where: { groupUsed: true }
    })
  ]);

  // Get user growth over time
  const userGrowthData = await getUserGrowthData();

  // Get revenue over time
  const revenueOverTime = await getPlatformRevenueData();

  return {
    stats: {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalSessions,
      totalBlogPosts,
      activeUsers,
      liveSessions,
      pendingPayouts: pendingPayouts._sum.requestedAmount || 0,
      totalFreeSessions,
      freeDemosUsed,
      freeGroupsUsed,
      conversionRate: totalUsers > 0 ? Math.round((totalEnrollments / totalUsers) * 100) : 0,
    },
    userGrowthData,
    revenueOverTime,
  };
}

// Helper functions
async function getRecentActivity(userId: string) {
  const [recentEnrollments, recentProgress, recentSessions] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId },
      include: {
        Course: { select: { title: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.lessonProgress.findMany({
      where: { userId },
      include: {
        Lesson: {
          select: {
            title: true,
            Chapter: {
              select: {
                Course: { select: { title: true } }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.liveSession.findMany({
      where: { studentId: userId },
      include: {
        teacher: {
          select: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  return { recentEnrollments, recentProgress, recentSessions };
}

async function getLearningProgress(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      Course: {
        include: {
          chapter: {
            include: {
              lessons: {
                include: {
                  lessonProgress: {
                    where: { userId }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return enrollments.map(enrollment => {
    // Flatten lessons from all chapters
    const allLessons = enrollment.Course.chapter.flatMap(chapter => chapter.lessons);
    const totalLessons = allLessons.length;
    const completedLessons = allLessons.filter(
      lesson => lesson.lessonProgress[0]?.completed
    ).length;

    return {
      courseId: enrollment.Course.id,
      courseTitle: enrollment.Course.title,
      totalLessons,
      completedLessons,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      enrolledAt: enrollment.createdAt,
      completedAt: null, // Enrollment doesn't have completedAt field
    };
  });
}

async function getEngagementMetrics(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    lessonsCompletedLast30Days,
    sessionsLast30Days,
    messagesLast30Days,
  ] = await Promise.all([
    prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        updatedAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.liveSession.count({
      where: {
        studentId: userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    }),
  ]);

  return {
    lessonsCompletedLast30Days,
    sessionsLast30Days,
    messagesLast30Days,
  };
}

async function getRevenueOverTime(teacherId: string) {
  // Optimized: Select only necessary fields
  const enrollments = await prisma.enrollment.findMany({
    where: {
      Course: { userId: teacherId }
    },
    orderBy: { createdAt: "asc" },
    select: {
      amount: true,
      createdAt: true
    }
  });

  // Group by month
  const monthlyRevenue: { [key: string]: number } = {};

  enrollments.forEach(enrollment => {
    const month = new Date(enrollment.createdAt).toISOString().slice(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (enrollment.amount || 0);
  });

  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue
  }));
}

async function getCoursePerformance(teacherId: string) {
  // Optimized: Fetch courses and aggregated stats separately to avoid loading all reviews
  const courses = await prisma.course.findMany({
    where: { userId: teacherId },
    select: { id: true, title: true }
  });

  if (courses.length === 0) return [];

  const courseIds = courses.map(c => c.id);

  const [enrollmentStats, reviewStats] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds }
      },
      _count: { _all: true },
      _sum: { amount: true }
    }),
    prisma.review.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds }
      },
      _count: { _all: true },
      _avg: { rating: true }
    })
  ]);

  // Map stats for O(1) lookup
  const enrollmentMap = new Map(enrollmentStats.map(s => [s.courseId, s]));
  const reviewMap = new Map(reviewStats.map(s => [s.courseId, s]));

  return courses.map(course => {
    const eStat = enrollmentMap.get(course.id);
    const rStat = reviewMap.get(course.id);

    return {
      id: course.id,
      title: course.title,
      enrollments: eStat?._count?._all || 0,
      reviews: rStat?._count?._all || 0,
      averageRating: rStat?._avg?.rating || 0,
      revenue: eStat?._sum?.amount || 0,
    };
  });
}

async function getUserGrowthData() {
  // Get user registrations by month for the last 12 months
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true }
  });

  const monthlyUsers: { [key: string]: number } = {};

  users.forEach(user => {
    const month = new Date(user.createdAt).toISOString().slice(0, 7);
    monthlyUsers[month] = (monthlyUsers[month] || 0) + 1;
  });

  return Object.entries(monthlyUsers).map(([month, count]) => ({
    month,
    users: count
  }));
}

async function getPlatformRevenueData() {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { createdAt: "asc" },
    select: {
      amount: true,
      createdAt: true
    }
  });

  const monthlyRevenue: { [key: string]: number } = {};

  enrollments.forEach(enrollment => {
    const month = new Date(enrollment.createdAt).toISOString().slice(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (enrollment.amount || 0);
  });

  return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
    month,
    revenue
  }));
}