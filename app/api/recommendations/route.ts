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
    const userId = searchParams.get('userId') || session.user.id;
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

    return NextResponse.json({
      personalized,
      trending,
      similar,
      learningPaths: [] // TODO: Implement learning paths
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