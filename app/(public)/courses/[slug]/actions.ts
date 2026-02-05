"use server";

import { requireUser } from "@/app/data/user/require-user";
import { protectEnrollmentAction } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { getRazorpayInstance, getRazorpayKeyId } from "@/lib/razorpay";
import { checkEnrollmentLimit } from "@/lib/subscription-limits";

export async function enrollInCourseAction(
  courseId: string
): Promise<any> {
  const user = await requireUser();

  try {
    // Apply security protection for enrollment actions
    const securityCheck = await protectEnrollmentAction(user.id);
    if (!securityCheck.success) {
      return {
        status: "error",
        message: securityCheck.error || "Security check failed",
      };
    }

    // [STRICT ENFORCEMENT] Check Subscription Limits
    const limitCheck = await checkEnrollmentLimit(user.id);
    if (!limitCheck.allowed) {
        return {
            status: "error",
            message: `You have reached your limit of ${limitCheck.limit} active course enrollments. Please upgrade your plan.`
        };
    }

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
      },
    });

    if (!course) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: courseId,
          },
        },
        select: {
          status: true,
          id: true,
        },
      });

      if (existingEnrollment?.status === "Active") {
        return {
          status: "already_enrolled",
          message: "You are already enrolled in this Course",
        };
      }

      let enrollment;

      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: {
            id: existingEnrollment.id,
          },
          data: {
            amount: course.price,
            status: "Pending",
            updatedAt: new Date(),
          },
        });
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            amount: course.price,
            status: "Pending",
          },
        });
      }

      // Razorpay Initialization
      const razorpay = await getRazorpayInstance();
      if (!razorpay) throw new Error("Razorpay failed to initialize");

      const amountInPaisa = Math.round(course.price); // Price is already in paisa/cents in DB
      const options = {
        amount: amountInPaisa.toString(),
        currency: "INR",
        receipt: enrollment.id,
        notes: {
          type: "COURSE_ENROLLMENT",
          courseId: course.id,
          enrollmentId: enrollment.id,
          userId: user.id,
        }
      };

      const order = await razorpay.orders.create(options);

      // Store Razorpay Order ID
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { razorpayOrderId: order.id }
      });

      return {
        status: "success",
        orderId: order.id,
        amount: amountInPaisa,
        currency: "INR",
        keyId: await getRazorpayKeyId(),
        courseName: course.title,
        user: {
          name: user.name,
          email: user.email,
        }
      };
    });

    return result;
  } catch (error) {
    console.error("Enrollment error:", error);
    return {
      status: "error",
      message: "Failed to enroll in course",
    };
  }
}
