import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Fetch Student's Group Class Enrollments
 * Author: Sanket
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await prisma.groupEnrollment.findMany({
      where: {
        studentId: session.user.id,
        status: { in: ["Active", "Pending"] }
      },
      include: {
        class: {
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
          }
        }
      },
      orderBy: {
        class: {
          scheduledAt: "asc"
        }
      }
    });

    const transformed = enrollments.map(e => ({
      id: e.class.id,
      enrollmentId: e.id,
      title: e.class.title,
      scheduledAt: e.class.scheduledAt,
      duration: e.class.duration,
      status: e.status,
      teacher: {
        name: e.class.teacher.user.name,
        image: e.class.teacher.user.image
      },
      meetingUrl: e.class.meetingUrl
    }));

    return NextResponse.json({
        status: "success",
        data: transformed
    });
  } catch (error) {
    console.error("Error fetching student groups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
