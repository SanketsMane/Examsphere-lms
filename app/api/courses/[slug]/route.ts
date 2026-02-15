import { NextRequest, NextResponse } from "next/server";
import { getIndividualCourse } from "@/app/data/course/get-course";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * API Route: Get Individual Course Details
 * Sanket
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug) {
      return new NextResponse("Slug is required", { status: 400 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const data = await getIndividualCourse(slug, userId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[COURSE_GET]", error);
    if (error.status === 404) {
      return new NextResponse("Course not found", { status: 404 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
