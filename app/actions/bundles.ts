"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";

/**
 * Bundle Management Server Actions
 * Author: Sanket
 */

export async function createBundle(data: {
    title: string;
    description?: string;
    price: number;
    sessionCount: number;
}) {
    try {
        const session = await getSessionWithRole();
        const teacherProfile = (session?.user as any).teacherProfile;
        
        if (!session || !teacherProfile) {
            return { error: "Unauthorized" };
        }

        const bundle = await prisma.sessionBundle.create({
            data: {
                teacherId: teacherProfile.id,
                title: data.title,
                description: data.description,
                price: data.price,
                sessionCount: data.sessionCount,
            }
        });

        revalidatePath("/teacher/bundles");
        return { success: true, bundleId: bundle.id };
    } catch (error) {
        logger.error("Create Bundle Error", { error });
        return { error: "Failed to create bundle" };
    }
}

export async function purchaseBundle(bundleId: string) {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const bundle = await prisma.sessionBundle.findUnique({
            where: { id: bundleId },
            include: { teacher: { include: { user: true } } }
        });

        if (!bundle) return { error: "Bundle not found" };

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"], // or whatever methods you support
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: bundle.title,
                            description: `${bundle.sessionCount} Sessions with ${bundle.teacher.user.name}`,
                        },
                        unit_amount: Math.round(bundle.price * 100),
                    },
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bundles?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bundles?canceled=true`,
            customer_email: session.user.email!,
            metadata: {
                userId: session.user.id,
                bundleId: bundle.id,
                type: "bundle_purchase"
            }
        });

        return { url: checkoutSession.url };
    } catch (error) {
        logger.error("Purchase Bundle Error", { error });
        return { error: "Failed to initiate purchase" };
    }
}

export async function getUserBundles() {
    try {
        const session = await getSessionWithRole();
        if (!session) return { bundles: [] };

        const bookings = await prisma.bundleBooking.findMany({
            where: { studentId: session.user.id },
            include: { bundle: { include: { teacher: { include: { user: true } } } } },
            orderBy: { createdAt: "desc" }
        });

        return { bundles: bookings };
    } catch (error) {
        logger.error("Get User Bundles Error", { error });
        return { bundles: [] };
    }
}
