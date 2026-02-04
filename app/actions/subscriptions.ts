"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Subscription Management Actions
 * Author: Sanket
 * NOTE: Stripe logic disabled for Razorpay migration. 
 * Razorpay Subscription integration required if this feature is needed.
 */

export async function createSubscriptionSession(planId: string) {
    return { error: "Subscriptions are temporarily disabled. Please contact support." };
    /*
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) return { error: "Plan not found" };

        // Stripe logic removed - Author: Sanket
    } catch (error) {
        logger.error("Create Subscription Session Error", { error });
        return { error: "Failed to create subscription session" };
    }
    */
}

export async function cancelSubscription() {
    return { error: "Subscriptions management is temporarily disabled. Please contact support." };
    /*
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const userSubscription = await prisma.userSubscription.findUnique({
            where: { userId: session.user.id }
        });

        if (!userSubscription) {
            return { error: "No active subscription found" };
        }
        // Stripe logic removed - Author: Sanket
    } catch (error) {
        logger.error("Cancel Subscription Error", { error });
        return { error: "Failed to cancel subscription" };
    }
    */
}

export async function getSubscriptionPlans() {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            orderBy: { price: "asc" }
        });
        return { plans };
    } catch (error) {
        logger.error("Get Subscription Plans Error", { error });
        return { plans: [] };
    }
}

export async function getUserSubscription() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { subscription: null };

        const subscription = await prisma.userSubscription.findUnique({
            where: { userId: session.user.id },
            include: { plan: true }
        });

        return { subscription };
    } catch (error) {
        logger.error("Get User Subscription Error", { error });
        return { subscription: null };
    }
}
