import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/teacher/courses - the signed-in teacher's own courses with chapters/lessons,
// for pickers such as the quiz builder.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role;
  if (role !== "teacher" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const courses = await prisma.course.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        chapter: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            title: true,
            lessons: {
              orderBy: { position: "asc" },
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    return NextResponse.json(
      courses.map(({ chapter, ...course }) => ({ ...course, chapters: chapter }))
    );
  } catch (error) {
    console.error("Error fetching teacher courses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
