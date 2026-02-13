"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { RefundStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

/**
 * Refund Management Server Actions
 * Author: Sanket
 */

export async function createRefundRequest(data: {
    courseId?: string;
    amount: number;
    reason: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    try {
        // Validation & Security Sweep (Author: Sanket)
        if (!data.courseId) return { error: "Course ID is required" };

        // 1. Verify Enrollment & Ownership (Fix QA-044/IDOR)
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: data.courseId
                }
            }
        });

        if (!enrollment) return { error: "Enrollment not found or unauthorized" };

        // 2. Prevent Duplicate Requests
        const existingRequest = await prisma.refundRequest.findFirst({
            where: {
                userId: session.user.id,
                courseId: data.courseId,
                status: "Pending"
            }
        });
        if (existingRequest) return { error: "A refund request is already pending for this course" };

        // 3. Precise Pricing (Force enrollment price to prevent client-side manipulation) - Fix QA-043
        const refundAmount = enrollment.amount; 

        const refund = await prisma.refundRequest.create({
            data: {
                userId: session.user.id,
                courseId: data.courseId,
                amount: refundAmount,
                reason: data.reason,
                status: "Pending",
            }
        });

        revalidatePath("/dashboard/purchases");
        return { success: true, refund };
    } catch (error) {
        logger.error("Refund request error", { error, data }, session.user.id);
        return { error: "Failed to request refund" };
    }
}

export async function updateRefundStatus(
    refundId: string,
    status: RefundStatus,
    notes?: string
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user as any).role !== "admin") {
        return { error: "Unauthorized" };
    }

    try {
        const { creditToWallet } = await import("@/app/actions/wallet");

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Refund with User Data
            const refund = await tx.refundRequest.findUnique({
                where: { id: refundId },
                include: { user: true }
            });

            if (!refund) throw new Error("Refund request not found");
            if (refund.status === "Approved" || refund.status === "Processed") {
                 throw new Error("Refund already processed");
            }

            // 2. Update Status
            const updatedRefund = await tx.refundRequest.update({
                where: { id: refundId },
                data: {
                    status,
                    adminNotes: notes,
                    processedAt: status === "Processed" || status === "Approved" ? new Date() : undefined,
                }
            });

            // 3. If Approved, trigger wallet credit and revoke course (Author: Sanket)
            if (status === "Approved") {
                // creditToWallet handled here
                await creditToWallet(
                    refund.userId,
                    refund.amount,
                    "REFUND",
                    `Refund for Course ID: ${refund.courseId}`,
                    { refundId: refund.id, courseId: refund.courseId },
                    tx as any
                );

                if (refund.courseId) {
                    await tx.enrollment.deleteMany({
                        where: {
                            userId: refund.userId,
                            courseId: refund.courseId
                        }
                    });
                }
            }

            return updatedRefund;
        });

        revalidatePath("/admin/payments/refunds");
        revalidatePath("/dashboard/purchases");
        return { success: true, refund: result };
    } catch (error: any) {
        logger.error("Update refund error", { error, refundId, status }, session.user.id);
        return { error: error.message || "Failed to update refund status" };
    }
}
