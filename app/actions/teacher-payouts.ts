"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/action-security";

export async function getTeacherPayoutData() {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            payoutRequests: {
                orderBy: { createdAt: "desc" },
                take: 20
            },
            liveSessions: {
                where: { status: "completed" }
            }
        }
    });

    if (!teacher) {
        // Return empty state for non-teachers or new accounts
        return {
            totalEarnings: 0,
            availableForPayout: 0,
            pendingPayouts: 0,
            totalSessions: 0,
            averageSessionEarning: 0,
            payoutHistory: []
        };
    }

    // 1. Calculate Earnings from Commissions (SSOT)
    const commissions = await prisma.commission.findMany({
        where: { teacherId: teacher.id }
    });

    const totalEarningsCents = commissions.reduce((sum, c) => sum + c.netAmount, 0);
    const availableCents = commissions
        .filter(c => c.status === "Pending")
        .reduce((sum, c) => sum + c.netAmount, 0);

    const totalEarnings = totalEarningsCents / 100.0;
    const availableForPayout = availableCents / 100.0;

    // 2. Calculate Payouts
    const allPayouts = await prisma.payoutRequest.findMany({
        where: { teacherId: teacher.id },
        orderBy: { createdAt: "desc" }
    });

    const pendingPayouts = allPayouts
        .filter(p => ["Pending", "UnderReview", "Approved", "Processing"].includes(p.status))
        .reduce((sum, p) => sum + Number(p.requestedAmount), 0);

    // 3. Session Stats
    const totalSessions = teacher.liveSessions.length;
    // Use simple division if sessions exist, otherwise 0
    const averageSessionEarning = totalSessions > 0
        ? (totalEarnings / totalSessions)
        : 0;

    return {
        totalEarnings,
        availableForPayout,
        pendingPayouts,
        totalSessions,
        averageSessionEarning,
        payoutHistory: teacher.payoutRequests.map(p => ({
            id: p.id,
            amount: Number(p.requestedAmount),
            status: p.status,
            requestedAt: p.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
            processedAt: p.processedAt ? p.processedAt.toISOString().split('T')[0] : undefined
        }))
    };
}

export async function requestPayout(data?: {
    amount?: number;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankName?: string;
}) {
    const session = await requireTeacher();

    const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            verification: true
        }
    });

    if (!teacherProfile) return { success: false, error: "Teacher profile not found" };

    // 1. Eligibility Check
    if (!teacherProfile.isApproved || !teacherProfile.isVerified) {
        return { success: false, error: "Your profile must be approved and verified to request payouts." };
    }

    // 2. Prevent Duplicate Requests
    const activePayout = await prisma.payoutRequest.findFirst({
        where: {
            teacherId: teacherProfile.id,
            status: { in: ["Pending", "Processing", "Approved"] }
        }
    });

    if (activePayout) {
        return { success: false, error: "You already have a payout request in progress." };
    }

    // Use bank details from args if provided (allowing overrides), otherwise from verification
    // But strict security might prefer verification only. 
    // However, existing verification flow saves to DB first.
    // WithdrawForm sends data that matches verification form usually.
    const { verification } = teacherProfile;
    const bankAccountName = data?.bankAccountName || verification?.bankAccountName;
    const bankAccountNumber = data?.bankAccountNumber || verification?.bankAccountNumber;
    // const bankName = data?.bankName; // Note used in DB model currently based on create below

    if (!bankAccountName || !bankAccountNumber) {
        return { success: false, error: "Bank details not configured. Please complete verification settings." };
    }

    // Calculate Available Balance
    const pendingCommissions = await prisma.commission.findMany({
        where: {
            teacherId: teacherProfile.id,
            status: "Pending"
        }
    });

    const totalCents = pendingCommissions.reduce((sum: number, c: any) => sum + c.netAmount, 0);
    const MIN_PAYOUT_CENTS = 5000; // $50.00
    if (totalCents < MIN_PAYOUT_CENTS) {
        return { success: false, error: `Minimum payout amount is $50.00. Current balance: $${(totalCents / 100).toFixed(2)}` };
    }

    // Note: We currently process ALL pending commissions regardless of requested 'amount'.
    // Partial payouts are not implemented.
    const requestedAmountDecimal = totalCents / 100.0;

    try {
        await prisma.$transaction(async (tx: any) => {
            // Re-verify balance inside transaction
            const currentPendingCommissions = await tx.commission.findMany({
                where: {
                    teacherId: teacherProfile.id,
                    status: "Pending"
                },
            });

            if (currentPendingCommissions.length === 0) {
                throw new Error("No pending commissions available for payout");
            }

            const currentTotalCents = currentPendingCommissions.reduce((sum: number, c: any) => sum + c.netAmount, 0);
            if (currentTotalCents < MIN_PAYOUT_CENTS) {
                throw new Error("Insufficient balance at transaction time");
            }

            const payoutRequest = await tx.payoutRequest.create({
                data: {
                    teacherId: teacherProfile.id,
                    requestedAmount: currentTotalCents / 100.0,
                    currency: "USD",
                    status: "Pending",
                    bankAccountName: bankAccountName || "Unknown",
                    bankAccountNumber: bankAccountNumber!,
                    bankRoutingNumber: verification?.bankRoutingNumber,
                    adminNotes: "Auto-generated request via Action"
                }
            });

            for (const comm of currentPendingCommissions) {
                await tx.payoutCommission.create({
                    data: {
                        payoutRequestId: payoutRequest.id,
                        commissionId: comm.id,
                        amount: comm.netAmount / 100.0
                    }
                });

                await tx.commission.update({
                    where: { id: comm.id },
                    data: { status: "Processing" }
                });
            }
        });

        // Send Email Notification
        try {
            const { sendTemplatedEmail } = await import("@/lib/email");
            if (session.user.email) {
                 await sendTemplatedEmail(
                    "payoutRequested",
                    session.user.email,
                    "Payout Request Received",
                    {
                        userName: session.user.name || "Partner",
                        amount: `$${requestedAmountDecimal.toFixed(2)}`
                    }
                );
            }
        } catch (e) {
            console.error("Failed to send payout email", e);
        }

        revalidatePath("/teacher/payouts");
        return { success: true };
    } catch (e: any) {
        console.error("Payout Transaction Failed", e);
        return { success: false, error: e.message || "Failed to process payout request" };
    }
}
