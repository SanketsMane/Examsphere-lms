import { prisma } from "./db";
import { UserSubscription, SubscriptionPlan } from "@prisma/client";

/**
 * Author: Sanket
 * Unified helper to check if a subscription is effectively active.
 * Considers both status and expiration date.
 */
export function isSubscriptionActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    
    // Status must be active or trialing
    const validStatus = ["active", "trialing"].includes(subscription.status);
    if (!validStatus) return false;

    // Check expiration if present
    if (subscription.currentPeriodEnd) {
        const now = new Date();
        return subscription.currentPeriodEnd > now;
    }

    return true;
}

/**
 * Author: Sanket
 * Fetches the user's active subscription and its plan.
 * Returns null if no active subscription exists.
 */
export async function getActiveUserSubscription(userId: string) {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
        include: { plan: true }
    });

    if (isSubscriptionActive(subscription)) {
        return subscription;
    }

    return null;
}

/**
 * Author: Sanket
 * Gets the effective subscription plan for a user.
 * If no active paid plan is found, returns the default (Free) plan for their role.
 */
export async function getEffectivePlan(userId: string, role: "TEACHER" | "STUDENT"): Promise<SubscriptionPlan | null> {
    const activeSub = await getActiveUserSubscription(userId);
    
    if (activeSub) {
        return activeSub.plan;
    }

    // Fallback to default plan for role
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { role, isDefault: true }
    });

    return defaultPlan;
}
