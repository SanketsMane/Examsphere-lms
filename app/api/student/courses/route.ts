import { NextResponse } from "next/server";
import { getEnrolledCourses } from "@/app/data/user/get-enrolled-courses";

/**
 * API Route: Get Enrolled Courses
 * Sanket
 */
export async function GET() {
  try {
    const data = await getEnrolledCourses();
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("[STUDENT_COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
