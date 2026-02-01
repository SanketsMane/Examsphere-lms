"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { PayoutRequestStatus, RefundStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function requestPayout(data: {
    amount: number;
    bankAccountName: string;
    bankAccountNumber: string;
    bankRoutingNumber?: string;
    bankName?: string;
    bankAddress?: string;
    swiftCode?: string;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user as any).role !== "teacher") {
        return { error: "Unauthorized" };
    }

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
    });

    if (!teacher) {
        return { error: "Teacher profile not found" };
    }

    if (!teacher.isVerified) {
        return { error: "Only verified teachers can request payouts" };
    }

    // Calculate earnings
    const payouts = await prisma.payoutRequest.findMany({
        where: {
            teacherId: teacher.id,
            status: {
                notIn: ["Rejected", "Failed", "Cancelled"]
            }
        }
    });

    const totalPaidOut = payouts.reduce((sum, p) => sum + Number(p.requestedAmount), 0);
    const availableBalance = Number(teacher.totalEarnings) - totalPaidOut;

    if (data.amount > availableBalance) {
        return { error: `Insufficient balance. Available: $${availableBalance}` };
    }

    try {
        const payout = await prisma.payoutRequest.create({
            data: {
                teacherId: teacher.id,
                requestedAmount: data.amount,
                bankAccountName: data.bankAccountName,
                bankAccountNumber: data.bankAccountNumber,
                bankRoutingNumber: data.bankRoutingNumber,
                bankName: data.bankName,
                bankAddress: data.bankAddress,
                swiftCode: data.swiftCode,
                status: "Pending",
            },
        });

        revalidatePath("/teacher/finance");
        return { success: true, payout };
    } catch (error) {
        logger.error("Payout request error", error as Error);
        return { error: "Failed to request payout" };
    }
}

export async function updatePayoutStatus(
    payoutId: string,
    status: PayoutRequestStatus,
    notes?: string
) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user || (session.user as any).role !== "admin") {
        return { error: "Unauthorized" };
    }

    try {
        const payout = await prisma.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status,
                adminNotes: notes,
                processedAt: status === "Completed" || status === "Approved" ? new Date() : undefined,
                processedById: session.user.id,
            },
            include: { teacher: true } // Include teacher to get email if needed for notification
        });

        revalidatePath("/admin/payments");
        return { success: true, payout };
    } catch (error) {
        logger.error("Update payout error", { error, payoutId, status }, session.user.id);
        return { error: "Failed to update payout status" };
    }
}

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
        const refund = await prisma.refundRequest.create({
            data: {
                userId: session.user.id,
                courseId: data.courseId,
                amount: data.amount,
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
        const refund = await prisma.refundRequest.update({
            where: { id: refundId },
            data: {
                status,
                adminNotes: notes,
                processedAt: status === "Processed" || status === "Approved" ? new Date() : undefined,
            }
        });

        revalidatePath("/admin/payments/refunds");
        return { success: true, refund };
    } catch (error) {
        logger.error("Update refund error", { error, refundId, status }, session.user.id);
        return { error: "Failed to update refund status" };
    }
}
