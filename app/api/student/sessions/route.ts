import { NextResponse } from "next/server";
import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";

/**
 * Get student's upcoming live sessions
 * Sanket
 */
export async function GET() {
  try {
    const user = await requireUser(false);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const sessions = await prisma.liveSession.findMany({
      where: {
        OR: [
          { studentId: user.id },
          { bookings: { some: { studentId: user.id, status: "confirmed" } } }
        ],
        status: "scheduled",
        scheduledAt: { gte: new Date() }
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: "asc"
      },
      take: 10
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[STUDENT_SESSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
