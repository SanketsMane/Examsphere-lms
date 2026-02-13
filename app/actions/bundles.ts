"use server";

import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { z } from "zod"; // author: Sanket

const bundleSchema = z.object({
    title: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    price: z.number().min(1), // cents
    sessionCount: z.number().min(1).max(100),
});

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
        const validated = bundleSchema.safeParse(data);
        if (!validated.success) {
            return { error: "Invalid bundle data" };
        }

        const session = await getSessionWithRole();
        const teacherProfile = (session?.user as any).teacherProfile;
        
        if (!session || !teacherProfile) {
            return { error: "Unauthorized" };
        }

        const bundle = await prisma.sessionBundle.create({
            data: {
                teacherId: teacherProfile.id,
                ...validated.data
            }
        });

        revalidatePath("/teacher/bundles");
        return { success: true, bundleId: bundle.id };
    } catch (error) {
        logger.error("Create Bundle Error", { error });
        return { error: "Failed to create bundle" };
    }
}

export async function getTeacherBundles() {
    try {
        const session = await getSessionWithRole();
        const teacherProfile = (session?.user as any).teacherProfile;
        
        if (!session || !teacherProfile) {
            return { bundles: [] }; // Or error, but empty list is safer for UI
        }

        const bundles = await prisma.sessionBundle.findMany({
            where: { teacherId: teacherProfile.id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { bookings: true }
                }
            }
        });

        return { bundles };
    } catch (error) {
        logger.error("Get Teacher Bundles Error", { error });
        return { bundles: [] };
    }
}

export async function purchaseBundle(bundleId: string, paymentMethod: 'razorpay' | 'wallet' = 'razorpay') {
    try {
        const session = await getSessionWithRole();
        if (!session) return { error: "Unauthorized" };

        const bundle = await prisma.sessionBundle.findUnique({
            where: { id: bundleId },
            include: { teacher: { include: { user: true } } }
        });

        if (!bundle) return { error: "Bundle not found" };

        // Ensure teacher is approved and verified - author: Sanket
        if (!bundle.teacher.isApproved || !bundle.teacher.isVerified) {
            return { error: "This teacher's bundles are currently unavailable" };
        }

        // Wallet Payment Flow (Author: Sanket)
        if (paymentMethod === 'wallet') {
             const { deductFromWallet } = await import("@/app/actions/wallet");
             
             try {
                return await prisma.$transaction(async (tx) => {
                    // 1. Deduct from wallet
                    await deductFromWallet(
                        session.user.id,
                        bundle.price,
                        "SESSION_BOOKING", 
                        `Purchased Bundle: ${bundle.title}`,
                        { bundleId: bundle.id, bundleTitle: bundle.title, type: "BUNDLE" },
                        tx
                    );

                    // 2. Create Bundle Booking
                    const booking = await tx.bundleBooking.create({
                        data: {
                            studentId: session.user.id,
                            bundleId: bundle.id,
                            sessionsLeft: bundle.sessionCount,
                            // paymentStatus: "COMPLETED" // Check schema if needed
                        }
                    });

                    return { success: true, bookingId: booking.id };
                });
             } catch (e: any) {
                 if (e.message?.includes("Insufficient")) return { error: "Insufficient wallet balance" };
                 throw e;
             }
        }

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
