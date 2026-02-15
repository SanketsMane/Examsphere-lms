import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/wishlist/[id]
 * Toggle "Like" interaction for a course (Wishlist)
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

    // Check if interaction already exists
    const existing = await prisma.userInteraction.findFirst({
      where: {
        userId: session.user.id,
        courseId,
        type: "Like"
      }
    });

    if (existing) {
      // Remove from wishlist
      await prisma.userInteraction.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ status: "removed", message: "Removed from wishlist" });
    } else {
      // Add to wishlist
      await prisma.userInteraction.create({
        data: {
          userId: session.user.id,
          courseId,
          type: "Like"
        }
      });
      return NextResponse.json({ status: "added", message: "Added to wishlist" });
    }
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/wishlist/[id]
 * Check if a specific course is in the user's wishlist
 * Sanket
 */
export async function GET(
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
    
        const existing = await prisma.userInteraction.findFirst({
          where: {
            userId: session.user.id,
            courseId,
            type: "Like"
          }
        });
    
        return NextResponse.json({ isInWishlist: !!existing });
      } catch (error) {
        console.error("Error checking wishlist status:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
}
