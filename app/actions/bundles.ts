"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

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

        // Razorpay Flow (Author: Sanket)
        const { getRazorpayInstance, getRazorpayKeyId } = await import("@/lib/razorpay");
        const razorpay = await getRazorpayInstance();
        
        const amountInPaisa = Math.round(bundle.price * 100);

        const options = {
            amount: amountInPaisa.toString(),
            currency: "INR",
            receipt: `bundle_${bundle.id}`,
            notes: {
                type: "BUNDLE_PURCHASE",
                userId: session.user.id,
                bundleId: bundle.id
            }
        };

        const order = await razorpay.orders.create(options);

        return { 
            orderId: order.id,
            amount: amountInPaisa,
            currency: "INR",
            keyId: await getRazorpayKeyId(),
            bundleTitle: bundle.title,
            user: {
                name: session.user.name,
                email: session.user.email,
            }
        };
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
