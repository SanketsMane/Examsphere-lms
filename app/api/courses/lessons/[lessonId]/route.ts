import { NextRequest, NextResponse } from "next/server";
import { getLessonContent } from "@/app/data/course/get-lesson-content";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * API Route: Get Lesson Content
 * Sanket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    
    if (!lessonId) {
      return new NextResponse("Lesson ID is required", { status: 400 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await getLessonContent(lessonId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[LESSON_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
