"use server";

import { requireTeacher } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { assertValidCategory } from "@/lib/course-categories";
import { ApiResponse } from "@/lib/types";
import { CourseSchemaType } from "@/lib/zodSchemas";
import {
  buildCourseData,
  handleCourseWriteError,
  teacherCourseSchema,
  toFieldErrors,
} from "@/lib/course-write";

/**
 * Create a course as a teacher.
 *
 * A teacher never chooses the publication state. New courses always start as
 * "Draft" and reach "Published" only through the admin approval flow
 * (see app/admin/courses/_components/CourseApprovalActions.tsx). Previously the
 * client-supplied `status` was spread into the create call, so a teacher could
 * select "Published" in the form and skip review entirely — and `isFeatured`
 * could be set the same way to win homepage placement.
 */
export async function CreateCourse(
  values: CourseSchemaType
): Promise<ApiResponse> {
  const session = await requireTeacher();
  const userId = (session.user as any).id as string;

  // Plan limit is enforced before doing any work.
  const { checkCourseLimit } = await import("@/lib/subscription-limits");
  const { allowed, limit } = await checkCourseLimit(userId);
  if (!allowed) {
    return {
      status: "error",
      message: `You have reached the limit of ${limit} courses for your current plan, or your subscription has expired. Please upgrade to create more.`,
    };
  }

  const validation = teacherCourseSchema.safeParse(values);
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
        ...buildCourseData(validation.data, { status: "Draft", isFeatured: false }),
        user: { connect: { id: userId } },
      },
      select: { id: true, slug: true },
    });

    return {
      status: "success",
      message: "Course created. Add your chapters, then submit it for review.",
      data: { id: course.id },
    };
  } catch (error) {
    return handleCourseWriteError(error, {
      action: "teacher.CreateCourse",
      userId,
      slug: validation.data.slug,
    });
  }
}
