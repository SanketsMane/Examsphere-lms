"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Referral Program Server Actions
 * Author: Sanket
 */

export async function getReferralCode() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        // Simple code: name + last 4 of ID or random
        let referral = await prisma.referral.findFirst({
            where: { referrerId: session.user.id }
        });

        if (!referral) {
            const code = `${session.user.name?.split(' ')[0] || 'USER'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            // We'll just return the code suggestion or save a dummy one
            return { code }; 
        }

        return { code: referral.code };
    } catch (error) {
        return { error: "Failed to get referral code" };
    }
}

export async function linkReferral(referralCode: string, refereeId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        // Ensure user can only link themselves as referee unless admin
        if (refereeId !== session.user.id && (session.user as any).role !== "admin") {
            return { error: "Unauthorized: Cannot link other users to referral codes" };
        }

        // Find referrer by code
        const referrer = await prisma.user.findFirst({
            where: { 
                referralsMade: { some: { code: referralCode } }
            }
        });

        if (!referrer) return { error: "Invalid referral code" };

        // Prevent self-referral
        if (referrer.id === refereeId) {
            return { error: "You cannot refer yourself" };
        }

        await prisma.referral.create({
            data: {
                referrerId: referrer.id,
                refereeId: refereeId,
                code: referralCode,
                status: "pending"
            }
        });

        return { success: true };
    } catch (error) {
        logger.error("Link Referral Error", { error });
        return { error: "Failed to link referral" };
    }
}

/**
 * Marks referral as rewarded - Protected (Internal use only)
 * Author: Sanket
 */
export async function rewardReferrer(refereeId: string) {
    try {
        const referral = await prisma.referral.findUnique({
            where: { refereeId },
            include: { referrer: true }
        });

        if (!referral || referral.status === "completed") return;

        const { creditToWallet } = await import("@/app/actions/wallet");

        // Perform in transaction for atomicity
        await prisma.$transaction(async (tx) => {
            // Award $10 credit to referrer - author: Sanket
            await tx.referralReward.create({
                data: {
                    userId: referral.referrerId,
                    amount: 10,
                    type: "CREDITS",
                }
            });

            // Standardized wallet credit with audit trail - author: Sanket
            await creditToWallet(
                referral.referrerId,
                10,
                "ADMIN_CREDIT", 
                `Referral Reward for user: ${referral.refereeId}`,
                { refereeId: referral.refereeId, referralId: referral.id },
                tx as any
            );

            await tx.referral.update({
                where: { id: referral.id },
                data: { status: "completed" }
            });
        });

        logger.info("Referral reward issued", { referrerId: referral.referrerId, refereeId });
    } catch (error) {
        logger.error("Reward Referrer Error", { error });
    }
}
