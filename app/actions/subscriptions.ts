"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { createRazorpaySubscription, getRazorpayKeyId } from "@/lib/razorpay";
import { logger } from "@/lib/logger";

/**
 * Subscription Management Actions
 */

// Helper interfaces to handle potential stale Prisma client types
interface ExtendedSubscriptionPlan {
    id: string;
    razorpayPlanId?: string | null;
    metadata?: any;
    name: string;
    price: number;
    interval: string;
}

interface ExtendedUserSubscription {
    id: string;
    userId: string;
    status: string;
    planId: string;
    razorpaySubscriptionId?: string | null;
    metadata?: any;
    plan?: ExtendedSubscriptionPlan;
    user?: any;
}

export async function createSubscriptionSession(planId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const planRaw = await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });
        const plan = planRaw as unknown as ExtendedSubscriptionPlan;

        if (!plan) return { error: "Plan not found" };

        if (!plan.razorpayPlanId) {
             return { error: "This plan is not configured for online subscription yet." };
        }

        // Create Razorpay Subscription
        const subscription = await createRazorpaySubscription(plan.razorpayPlanId);
        
        // We create a pending record in UserSubscription? 
        // Or wait for webhook?
        // Usually, we just return the subscription_id to frontend.
        // The webhook 'subscription.authenticated' will handle activation.
        
        // However, we might want to store the subscription_id to map it later if needed.
        // For now, we rely on webhook finding the user via email? 
        // No, Razorpay subscription doesn't necessarily carry user ID unless in notes.
        // We SHOULD update the subscription notes.
        
        // But the `createRazorpaySubscription` helper I wrote didn't accept notes.
        // I might need to update it or pass notes.
        // For now, let's assume the user email matches or I'll add a pending record.
        
        await prisma.userSubscription.upsert({
            where: { userId: session.user.id },
            update: {
                razorpaySubscriptionId: subscription.id,
                status: "created",
                planId: plan.id
            } as any,
            create: {
                userId: session.user.id,
                planId: plan.id,
                status: "created",
                razorpaySubscriptionId: subscription.id
            } as any
        });

        const key = await getRazorpayKeyId();

        return { 
            subscriptionId: subscription.id, 
            key: key 
        };

    } catch (error: any) {
        logger.error("Create Subscription Session Error", { error });
        return { error: error.message || "Failed to create subscription session" };
    }
}

export async function cancelSubscription() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const subscriptionRaw = await prisma.userSubscription.findUnique({
            where: { userId: session.user.id }
        });

        const subscription = subscriptionRaw as unknown as ExtendedUserSubscription;

        if (!subscription || !subscription.razorpaySubscriptionId) {
            return { error: "No active online subscription found" };
        }

        const { cancelRazorpaySubscription } = await import("@/lib/razorpay");
        // Cancel at closest possible time (usually end of cycle or immediate depending on implementation)
        // Razorpay API defaults to cancel_at_cycle_end=false (immediate) unless specified.
        await cancelRazorpaySubscription(subscription.razorpaySubscriptionId);

        // Local DB state should ideally be updated via Webhooks to avoid race conditions.
        // We only initiate the cancellation via API.
        
        // Note: Removing the manual update here to ensure Webhooks are the SSOT.
        // Author: Sanket

        return { success: true };
    } catch (error: any) {
        logger.error("Cancel Subscription Error", { error });
        return { error: error.message || "Failed to cancel subscription" };
    }
}

export async function getSubscriptionUsage() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { usage: null };

        const userId = session.user.id;
        const [courseCount, groupCount, enrollmentCount, subscription] = await Promise.all([
            prisma.course.count({ where: { userId } }),
            prisma.groupClass.count({ where: { teacherId: userId, status: { in: ["Scheduled"] } } }),
            prisma.enrollment.count({ where: { userId, status: "Active" } }),
            prisma.userSubscription.findUnique({ 
                where: { userId },
                include: { plan: true }
            }) as Promise<ExtendedUserSubscription | null>
        ]);

        let limits = { maxCourses: 3, maxGroups: 2, maxEnrollments: 5 }; // Defaults
        if (subscription && subscription.status === 'active' && subscription.plan?.metadata) {
            const meta = subscription.plan.metadata;
             if (typeof meta.maxCourses === 'number') limits.maxCourses = meta.maxCourses;
             if (typeof meta.maxGroups === 'number') limits.maxGroups = meta.maxGroups;
             if (typeof meta.maxEnrollments === 'number') limits.maxEnrollments = meta.maxEnrollments;
        }

        return {
            usage: {
                courses: { used: courseCount, limit: limits.maxCourses },
                groups: { used: groupCount, limit: limits.maxGroups },
                enrollments: { used: enrollmentCount, limit: limits.maxEnrollments }
            }
        };

    } catch (error) {
        console.error("Get Usage Error:", error);
        return { usage: null };
    }
}

export async function getBillingHistory() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { transactions: [] };

        const transactions = await prisma.systemTransaction.findMany({
            where: { 
                userId: session.user.id,
                type: { in: ["SUBSCRIPTION_PURCHASE", "SUBSCRIPTION_RENEWAL"] as any }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        return { transactions };
    } catch (error) {
        console.error("Get Billing History Error:", error);
        return { transactions: [] };
    }
}

// import { UserRole } from "@prisma/client"; // Removed to avoid export issues

export async function getSubscriptionPlans(role?: "TEACHER" | "STUDENT") {
    try {
        const where: any = role ? { role } : {};
        const plans = await prisma.subscriptionPlan.findMany({
            where,
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
