import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/wishlist
 * List all courses in the user's wishlist
 * Sanket
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(h => h.headers())
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interactions = await prisma.userInteraction.findMany({
      where: {
        userId: session.user.id,
        type: "Like"
      },
      include: {
        course: {
            select: {
                id: true,
                title: true,
                price: true,
                fileKey: true,
                averageRating: true,
                totalReviews: true,
                category: true,
            }
        }
      },
      orderBy: { timestamp: "desc" }
    });

    const courses = interactions.map(i => i.course).filter(Boolean);

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
