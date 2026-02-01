"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";

type ActionState = {
    success?: boolean;
    error?: string;
    timestamp?: number;
};


export async function createTestimonial(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const name = formData.get("name") as string;
        const role = formData.get("role") as string;
        const content = formData.get("content") as string;
        const image = formData.get("image") as string;
        const isFeatured = formData.get("isFeatured") === "on";
        const isActive = formData.get("isActive") === "on";

        if (!name || !content) return { error: "Name and Content are required" };

        await prisma.testimonial.create({
            data: {
                name,
                role,
                content,
                image,
                isFeatured,
                isActive,
            },
        });

        revalidatePath("/admin/testimonials");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateTestimonial(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const role = formData.get("role") as string;
        const content = formData.get("content") as string;
        const image = formData.get("image") as string;
        const isFeatured = formData.get("isFeatured") === "on";
        const isActive = formData.get("isActive") === "on";

        if (!id || !name) return { error: "ID and Name are required" };

        await prisma.testimonial.update({
            where: { id },
            data: {
                name,
                role,
                content,
                image,
                isFeatured,
                isActive,
            },
        });

        revalidatePath("/admin/testimonials");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function deleteTestimonial(id: string) {
    try {
        await requireAdmin();
        await prisma.testimonial.delete({ where: { id } });
        revalidatePath("/admin/testimonials");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
