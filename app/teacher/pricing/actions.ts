"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { SessionType } from "@prisma/client";
import { requireTeacher } from "@/lib/action-security";
import { MAX_COURSE_PRICE } from "@/lib/money";

const SESSION_TYPES = new Set<string>(Object.values(SessionType));

interface PricingInput {
    allowFreeDemo: boolean;
    allowFreeGroup: boolean;
    pricing: { type: string; price: number; duration?: number }[];
}

/**
 * Update the signed-in teacher's pricing and free-trial settings.
 * The profile is derived from the session — never from a client-supplied id.
 * Prices are whole rupees.
 */
export async function updateTeacherPricing(formData: PricingInput) {
    const session = await requireTeacher();

    const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });
    if (!teacher) {
        return { error: "Teacher profile not found" };
    }

    const pricing = Array.isArray(formData?.pricing) ? formData.pricing : [];
    for (const item of pricing) {
        if (!SESSION_TYPES.has(item.type)) {
            return { error: `Unknown session type: ${item.type}` };
        }
        if (!Number.isInteger(item.price) || item.price < 0 || item.price > MAX_COURSE_PRICE) {
            return { error: "Prices must be whole rupees of 0 or more" };
        }
        if (item.duration !== undefined && (!Number.isInteger(item.duration) || item.duration < 0 || item.duration > 600)) {
            return { error: "Duration must be between 0 and 600 minutes" };
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.teacherProfile.update({
                where: { id: teacher.id },
                data: {
                    allowFreeDemo: !!formData.allowFreeDemo,
                    allowFreeGroup: !!formData.allowFreeGroup,
                },
            });

            for (const item of pricing) {
                const type = item.type as SessionType;
                await tx.teacherPricing.upsert({
                    where: { teacherId_type: { teacherId: teacher.id, type } },
                    create: {
                        teacherId: teacher.id,
                        type,
                        price: item.price,
                        duration: item.duration || 60,
                    },
                    update: {
                        price: item.price,
                        duration: item.duration || 60,
                    },
                });
            }
        });

        revalidatePath("/teacher/pricing");
        return { success: true };
    } catch (error) {
        console.error("Update pricing error:", error);
        return { error: "Failed to update pricing" };
    }
}
