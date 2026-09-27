"use server";

import { requireUser } from "@/app/data/user/require-user";
import { protectEnrollmentAction } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import {
  getRazorpayInstance,
  getRazorpayKeyId,
  isRazorpayConfigured,
  PAYMENTS_UNAVAILABLE_MESSAGE,
} from "@/lib/razorpay";
import { checkEnrollmentLimit } from "@/lib/subscription-limits";
import { toPaise } from "@/lib/money";
import { createCourseCommission, redeemCoupon, validateCourseCoupon } from "@/lib/course-purchase";
import { logger } from "@/lib/logger";

export async function enrollInCourseAction(
  courseId: string
): Promise<any> {
  const user = await requireUser();
  if (!user) return { status: "error", message: "Please log in to enroll" };

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

    if (!(await isRazorpayConfigured())) {
      return { status: "error", message: PAYMENTS_UNAVAILABLE_MESSAGE };
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
        status: true,
      },
    });

    if (!course || course.status !== "Published") {
      return {
        status: "error",
        message: "This course is not available for purchase",
      };
    }

    if (course.price <= 0) {
      return { status: "error", message: "This course is free. Use the Enroll for Free button." };
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
      select: { status: true },
    });

    if (existingEnrollment?.status === "Active") {
      return {
        status: "already_enrolled",
        message: "You are already enrolled in this Course",
      };
    }

    // Enrollment.amount is whole rupees; only the Razorpay order is in paise.
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: { amount: course.price, status: "Pending" },
      create: { userId: user.id, courseId: course.id, amount: course.price, status: "Pending" },
    });

    // Network call kept outside any DB transaction so a slow gateway can't hold locks.
    const razorpay = await getRazorpayInstance();
    const amountInPaisa = toPaise(course.price);
    const order = await razorpay.orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt: enrollment.id,
      notes: {
        type: "COURSE_ENROLLMENT",
        courseId: course.id,
        enrollmentId: enrollment.id,
        userId: user.id,
      }
    });

    await prisma.enrollment.update({
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
      courseSlug: course.slug,
      user: {
        name: user.name,
        email: user.email,
      }
    };
  } catch (error) {
    logger.error("Course enrollment (Razorpay) error", { error, courseId }, user.id);
    return {
      status: "error",
      message: "Could not start the payment. Please try again in a moment.",
    };
  }
}

/**
 * Enroll in a course using Wallet Balance
 * @author Sanket
 */
export async function enrollInCourseWithWallet(courseId: string, couponCode?: string) {
    const user = await requireUser();
    if (!user) return { status: "error", message: "Please log in to enroll" };

    try {
        const securityCheck = await protectEnrollmentAction(user.id);
        if (!securityCheck.success) {
            return { status: "error", message: securityCheck.error || "Security check failed" };
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
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                price: true,
                slug: true,
                status: true,
                userId: true,
                user: { select: { teacherProfile: { select: { id: true } } } },
            }
        });

        if (!course || course.status !== "Published") {
            return { status: "error", message: "This course is not available for purchase" };
        }

        return await prisma.$transaction(async (tx) => {
            const existingEnrollment = await tx.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: user.id,
                        courseId: courseId,
                    },
                },
            });

            if (existingEnrollment?.status === "Active") {
                return { status: "already_enrolled", message: "You are already enrolled in this Course", slug: course.slug };
            }

            let finalPrice = course.price;
            let couponId: string | undefined;

            if (couponCode?.trim() && finalPrice > 0) {
                const coupon = await validateCourseCoupon(tx, {
                    code: couponCode,
                    userId: user.id,
                    course: { price: course.price, userId: course.userId, teacherProfileId: course.user.teacherProfile?.id },
                });
                if (!coupon.ok) {
                    return { status: "error", message: coupon.message };
                }
                finalPrice = coupon.finalPrice;
                couponId = coupon.couponId;
            }

            if (couponId && !(await redeemCoupon(tx, couponId, user.id))) {
                return { status: "error", message: "This coupon has reached its usage limit" };
            }

            if (finalPrice > 0) {
                 const { deductFromWallet } = await import("@/lib/wallet-internal");
                 await deductFromWallet(
                    user.id,
                    finalPrice,
                    "COURSE_PURCHASE",
                    `Enrolled in course: ${course.title}`,
                    { courseId: course.id, courseTitle: course.title, couponId },
                    tx
                );
            }

            const enrollment = existingEnrollment
                ? await tx.enrollment.update({
                    where: { id: existingEnrollment.id },
                    data: { status: "Active", amount: finalPrice }
                })
                : await tx.enrollment.create({
                    data: {
                        userId: user.id,
                        courseId: course.id,
                        amount: finalPrice,
                        status: "Active"
                    }
                });

            // Same commission record the Razorpay webhook creates (paise).
            await createCourseCommission(tx, course.id, toPaise(finalPrice), {
                enrollmentId: enrollment.id,
                studentId: user.id,
                paidVia: "wallet",
            });

            await tx.notification.create({
                data: {
                    userId: user.id,
                    title: "Course Enrollment Successful",
                    message: `You're now enrolled in "${course.title}".`,
                    type: "Course",
                    data: { courseId: course.id, action: "enrolled" },
                }
            });

            return { status: "success", message: "Enrolled successfully", slug: course.slug };
        });

    } catch (error: any) {
        if (error?.message?.includes("Insufficient balance")) {
            return { status: "error", message: error.message };
        }
        logger.error("Wallet enrollment error", { error, courseId }, user.id);
        return { status: "error", message: "Could not complete the wallet payment. Your balance was not charged." };
    }
}
