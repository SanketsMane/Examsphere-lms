"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createSubscriptionPlan(data: {
    name: string;
    description?: string;
    price: number;
    interval?: string;
    role: UserRole;
    features: string[];
    razorpayPlanId?: string;
    metadata?: any;
    isDefault?: boolean;
}) {
    const session = await requireAdmin();
    if (!session) return { error: "Unauthorized" };

    try {
        const plan = await prisma.subscriptionPlan.create({
            data: {
                ...data,
                features: data.features.filter(f => f.trim() !== ""),
            }
        });
        revalidatePath("/admin/subscriptions");
        return { success: true, plan };
    } catch (error: any) {
        console.error("Create Plan Error:", error);
        return { error: error.message || "Failed to create plan" };
    }
}

export async function updateSubscriptionPlan(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    role: UserRole;
    features: string[];
    razorpayPlanId: string;
    metadata: any;
    isDefault: boolean;
}>) {
    const session = await requireAdmin();
    if (!session) return { error: "Unauthorized" };

    try {
        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                ...data,
                features: data.features ? data.features.filter(f => f.trim() !== "") : undefined,
            }
        });
        revalidatePath("/admin/subscriptions");
        return { success: true, plan };
    } catch (error: any) {
        console.error("Update Plan Error:", error);
        return { error: error.message || "Failed to update plan" };
    }
}

export async function deleteSubscriptionPlan(id: string) {
    const session = await requireAdmin();
    if (!session) return { error: "Unauthorized" };

    try {
        await prisma.subscriptionPlan.delete({ where: { id } });
        revalidatePath("/admin/subscriptions");
        return { success: true };
    } catch (error: any) {
         console.error("Delete Plan Error:", error);
        return { error: "Failed to delete plan (it might have active subscribers)" };
    }
}
