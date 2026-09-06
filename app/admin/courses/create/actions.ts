"use server";

import { requireAdmin } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { assertValidCategory } from "@/lib/course-categories";
import { ApiResponse } from "@/lib/types";
import { CourseSchemaType } from "@/lib/zodSchemas";
import {
  adminCourseSchema,
  buildCourseData,
  handleCourseWriteError,
  toFieldErrors,
} from "@/lib/course-write";

/**
 * Create a course as an admin.
 *
 * Gated by `requireAdmin`, not `requireTeacher`. The previous guard accepted any
 * teacher, and this action — unlike the teacher one — performs no subscription
 * course-limit check, so reaching it was a way around the plan limit.
 *
 * Admins may set `status` and `isFeatured`; they own the approval workflow.
 */
export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  const session = await requireAdmin();
  const userId = (session.user as any).id as string;

  const validation = adminCourseSchema.safeParse(values);
  if (!validation.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(validation.error),
    };
  }

  const categoryError = await assertValidCategory(validation.data.category);
  if (categoryError) {
    return {
      status: "error",
      message: categoryError,
      fieldErrors: { category: categoryError },
    };
  }

  try {
    const course = await prisma.course.create({
      data: {
        ...buildCourseData(validation.data, {
          status: validation.data.status,
          isFeatured: validation.data.isFeatured ?? false,
        }),
        user: { connect: { id: userId } },
      },
      select: { id: true, slug: true },
    });

    return {
      status: "success",
      message: "Course created successfully.",
      data: { id: course.id },
    };
  } catch (error) {
    return handleCourseWriteError(error, {
      action: "admin.CreateCourse",
      userId,
      slug: validation.data.slug,
    });
  }
}
