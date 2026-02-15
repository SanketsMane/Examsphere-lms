import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

/**
 * GET /api/reviews/[courseId]
 * Publicly viewable course reviews
 * Sanket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id;

    const reviews = await prisma.review.findMany({
      where: { courseId },
      include: {
        reviewer: {
          select: {
            name: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/reviews/[courseId]
 * Submit or update a course review (Enrollment locked)
 * Sanket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = params.id;
    const body = await req.json();
    const validatedData = reviewSchema.parse(body);

    // Verify Enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "You must be enrolled to review this course." }, { status: 403 });
    }

    // Upsert Review
    const review = await prisma.review.upsert({
      where: {
        // We need a unique constraint or use findFirst + update/create
        // Review model doesn't have a unique constraint on [courseId, reviewerId] in schema.prisma?
        // Let's check schema again or use findFirst
        id: (await prisma.review.findFirst({
            where: { courseId, reviewerId: session.user.id },
            select: { id: true }
        }))?.id || "new-id-placeholder"
      },
      update: {
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      create: {
        courseId,
        reviewerId: session.user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
        isVerified: true
      }
    });

    // Update Course Aggregate Rating
    const aggregations = await prisma.review.aggregate({
        where: { courseId },
        _avg: { rating: true },
        _count: { rating: true }
    });

    await prisma.course.update({
        where: { id: courseId },
        data: {
            averageRating: aggregations._avg.rating || 0,
            totalReviews: aggregations._count.rating || 0
        }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error submitting review:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
