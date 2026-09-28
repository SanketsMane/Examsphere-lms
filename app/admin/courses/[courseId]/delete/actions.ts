"use server";

import { requireAdmin } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  try {
    await requireAdmin();
  } catch {
    return { status: "error", message: "Unauthorized: Admin access required" };
  }

  try {
    await prisma.course.delete({
      where: {
        id: courseId,
      },
    });

    revalidatePath("/admin/courses");

    return {
      status: "success",
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Failed to delete Course!",
    };
  }
}
