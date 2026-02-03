"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Subscription Management Actions
 * Author: Sanket
 */

export async function createSubscriptionSession(planId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) return { error: "Plan not found" };

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/subscription?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/subscription?canceled=true`,
            customer_email: session.user.email!,
            metadata: {
                userId: session.user.id,
                planId: plan.id,
                type: "subscription"
            }
        });

        return { url: checkoutSession.url };
    } catch (error) {
        logger.error("Create Subscription Session Error", { error });
        return { error: "Failed to create checkout session" };
    }
}

export async function cancelSubscription() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const userSubscription = await prisma.userSubscription.findUnique({
            where: { userId: session.user.id }
        });

        if (!userSubscription || !userSubscription.stripeSubscriptionId) {
            return { error: "No active subscription found" };
        }

        // Cancel at period end
        await stripe.subscriptions.update(userSubscription.stripeSubscriptionId, {
            cancel_at_period_end: true
        });

        await prisma.userSubscription.update({
            where: { id: userSubscription.id },
            data: { cancelAtPeriodEnd: true }
        });

        revalidatePath("/dashboard/settings/subscription");
        return { success: true };
    } catch (error) {
        logger.error("Cancel Subscription Error", { error });
        return { error: "Failed to cancel subscription" };
    }
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
