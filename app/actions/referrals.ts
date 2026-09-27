"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
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
