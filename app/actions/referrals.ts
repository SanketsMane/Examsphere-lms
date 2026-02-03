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
        // Find referrer by code
        // For simplicity, we assume codes match a specific format or we search all referrals
        const referrer = await prisma.user.findFirst({
            where: { 
                // In a real app, you'd have a ReferralCode model, but we'll use a hack for now 
                // or assume the code is stored in User metadata or a dedicated table.
                // Given our schema added Referral model:
                referralsMade: { some: { code: referralCode } }
            }
        });

        if (!referrer) return { error: "Invalid referral code" };

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

export async function rewardReferrer(refereeId: string) {
    try {
        const referral = await prisma.referral.findUnique({
            where: { refereeId },
            include: { referrer: true }
        });

        if (!referral || referral.status === "completed") return;

        // Award $10 credit to referrer
        await prisma.referralReward.create({
            data: {
                userId: referral.referrerId,
                amount: 10,
                type: "CREDITS",
            }
        });

        // Add to wallet if it exists
        await prisma.wallet.upsert({
            where: { userId: referral.referrerId },
            update: { balance: { increment: 10 } },
            create: { userId: referral.referrerId, balance: 10 }
        });

        await prisma.referral.update({
            where: { id: referral.id },
            data: { status: "completed" }
        });

        logger.info("Referral reward issued", { referrerId: referral.referrerId, refereeId });
    } catch (error) {
        logger.error("Reward Referrer Error", { error });
    }
}
