"use server";

import { requireAdmin } from "@/lib/action-security";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PayoutRequestStatus } from "@prisma/client";
import { sendTemplatedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function updatePayoutStatus(
    payoutId: string,
    status: PayoutRequestStatus
) {
    const session = await requireAdmin();

    try {
        const payout = await prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: { teacher: { include: { user: true } } }
        });

        if (!payout) {
            throw new Error("Payout request not found");
        }

        // Update status
        const updatedPayout = await prisma.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status: status,
                processedAt: status === "Completed" || status === "Approved" ? new Date() : undefined
            }
        });

        // Notifications
        if (payout.teacher.user.email) {
            if (status === "Approved") {
                await sendTemplatedEmail(
                    "payoutApproved",
                    payout.teacher.user.email,
                    "Payout Request Approved",
                    {
                        userName: payout.teacher.user.name || "Teacher",
                        amount: `$${payout.requestedAmount}`
                    }
                );
            } else if (status === "Rejected") {
                 await sendTemplatedEmail(
                    "payoutRejected",
                    payout.teacher.user.email,
                    "Payout Request Update",
                    {
                        userName: payout.teacher.user.name || "Teacher",
                        reason: "Please contact support for details."
                    }
                );
            } else if (status === "Completed") {
                 await sendTemplatedEmail(
                    "payoutProcessed",
                    payout.teacher.user.email,
                    "Payout Sent to Bank",
                    {
                        userName: payout.teacher.user.name || "Teacher",
                        amount: `$${payout.requestedAmount}`
                    }
                );
            }
        }

        revalidatePath("/admin/payments/payouts");
        return { success: true };
    } catch (error: any) {
        logger.error("Failed to update payout status", error, payoutId);
        return { success: false, message: error.message || "Failed to update status" };
    }
}
