import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recommendationEngine } from "@/lib/recommendation-engine";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let userId = session.user.id;
    
    // IDOR Protection: Only admins can fetch recommendations for other users
    const requestedUserId = searchParams.get('userId');
    if (requestedUserId && requestedUserId !== session.user.id) {
       const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
       if (user?.role === "admin") {
          userId = requestedUserId;
       } else {
          return NextResponse.json({ error: "Access denied: Cannot fetch recommendations for another user" }, { status: 403 });
       }
    }

    const currentCourse = searchParams.get('currentCourse') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user preferences and recent activity
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId }
    });

    const recentActivity = await prisma.userInteraction.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    const enrolledCourses = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true }
    });

    // Fetch detailed progress to determine true completion
    const enrollmentData = await prisma.enrollment.findMany({
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

    const trulyCompletedCourseIds = enrollmentData
      .filter(enrollment => {
        const allLessons = enrollment.Course.chapter.flatMap(c => c.lessons);
        if (allLessons.length === 0) return false;
        const completedCount = allLessons.filter(l => l.lessonProgress[0]?.completed).length;
        return completedCount === allLessons.length;
      })
      .map(e => e.courseId);

    // Build recommendation context
    const context = {
      userId,
      currentCourse,
      recentActivity: recentActivity.map(activity => ({
        type: activity.type.toLowerCase() as any,
        courseId: activity.courseId || undefined,
        category: activity.category || undefined,
        timestamp: activity.timestamp
      })) as any[],
      completedCourses: trulyCompletedCourseIds,
      enrolledCourses: enrolledCourses.map(c => c.courseId),
      searchHistory: recentActivity
        .filter(a => a.type === 'Search' && a.searchQuery)
        .map(a => a.searchQuery!)
        .slice(0, 10),
      preferences: {
        userId,
        categories: userPreferences?.categories || [],
        difficulty: userPreferences?.difficulty || [],
        priceRange: [
          userPreferences?.priceRangeMin || 0,
          userPreferences?.priceRangeMax || 1000
        ] as [number, number],
        learningStyle: userPreferences?.learningStyle?.toLowerCase() as any || 'visual',
        timeAvailability: userPreferences?.timeAvailability?.toLowerCase() as any || 'medium',
        goals: userPreferences?.goals || []
      }
    };

    // Generate recommendations
    const [personalized, trending, similar] = await Promise.all([
      recommendationEngine.getPersonalizedRecommendations(context, limit),
      recommendationEngine.getTrendingRecommendations(limit),
      currentCourse
        ? recommendationEngine.getSimilarCourses(currentCourse, Math.min(limit, 5))
        : []
    ]);

    // Store recommendations in database for analytics
    await Promise.all([
      ...personalized.map(rec =>
        prisma.courseRecommendation.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: rec.courseId
            }
          },
          update: {
            confidence: rec.confidence,
            reasons: rec.reasons,
            tags: rec.tags,
            algorithm: 'personalized',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          },
          create: {
            userId,
            courseId: rec.courseId,
            confidence: rec.confidence,
            reasons: rec.reasons,
            tags: rec.tags,
            algorithm: 'personalized',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        })
      )
    ]);

    // 4. Generate Learning Paths
    // We'll create one or two paths based on user's top categories
    const topCategories = await prisma.userInteraction.groupBy({
      by: ['category'],
      where: { userId },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 2
    });

    const learningPaths: any[] = [];
    for (const cat of topCategories) {
      if (!cat.category) continue;
      
      const coursesInPath = await prisma.course.findMany({
        where: { 
          category: cat.category,
          status: 'Published'
        },
        orderBy: [
          { level: 'asc' },
          { totalStudents: 'desc' }
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          level: true,
          slug: true,
          fileKey: true
        }
      });

      if (coursesInPath.length >= 2) {
        learningPaths.push({
          id: `path-${cat.category}`,
          title: `${cat.category} Mastery Path`,
          description: `A guided sequence to master ${cat.category} from basic to advanced.`,
          category: cat.category,
          courses: coursesInPath.map((course, index) => ({
            ...course,
            status: trulyCompletedCourseIds.includes(course.id) ? 'Completed' : 
                    enrolledCourses.some(e => e.courseId === course.id) ? 'In Progress' : 'Locked',
            order: index + 1
          }))
        });
      }
    }

    return NextResponse.json({
      personalized,
      trending,
      similar,
      learningPaths
    });

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

// Update user preferences
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferences } = body;

    const updated = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        categories: preferences.categories,
        difficulty: preferences.difficulty,
        priceRangeMin: preferences.priceRange[0],
        priceRangeMax: preferences.priceRange[1],
        learningStyle: preferences.learningStyle.toUpperCase(),
        timeAvailability: preferences.timeAvailability.toUpperCase(),
        goals: preferences.goals,
        topics: preferences.topics || [],
        languages: preferences.languages || ['English']
      },
      create: {
        userId: session.user.id,
        categories: preferences.categories,
        difficulty: preferences.difficulty,
        priceRangeMin: preferences.priceRange[0],
        priceRangeMax: preferences.priceRange[1],
        learningStyle: preferences.learningStyle.toUpperCase(),
        timeAvailability: preferences.timeAvailability.toUpperCase(),
        goals: preferences.goals,
        topics: preferences.topics || [],
        languages: preferences.languages || ['English']
      }
    });

    return NextResponse.json({ success: true, preferences: updated });

  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}