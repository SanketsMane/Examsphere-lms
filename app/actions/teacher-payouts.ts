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

export async function requestPayout() {
    const session = await requireTeacher();

    const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        include: {
            verification: true // Correct relation name
        }
    });

    if (!teacherProfile) throw new Error("Teacher profile not found");

    const { verification } = teacherProfile;
    if (!verification || !verification.bankAccountNumber) {
        throw new Error("Bank details not configured. Please complete verification settings.");
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
        throw new Error(`Minimum payout amount is $50.00. Current balance: $${(totalCents / 100).toFixed(2)}`);
    }

    const requestedAmountDecimal = totalCents / 100.0;

    try {
        await prisma.$transaction(async (tx: any) => {
            const payoutRequest = await tx.payoutRequest.create({
                data: {
                    teacherId: teacherProfile.id,
                    requestedAmount: requestedAmountDecimal,
                    currency: "USD",
                    status: "Pending",
                    bankAccountName: verification.bankAccountName || "Unknown",
                    bankAccountNumber: verification.bankAccountNumber!,
                    bankRoutingNumber: verification.bankRoutingNumber,
                    adminNotes: "Auto-generated request via Action"
                }
            });

            for (const comm of pendingCommissions) {
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
        throw new Error("Failed to process payout request");
    }
}
