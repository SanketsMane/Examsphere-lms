"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { requireAdmin } from "@/lib/action-security";

// Provide a type-safe ActionState interface
export type ActionState = {
    success?: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    timestamp?: number;
};

export async function createSubject(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const name = formData.get("name") as string;
        if (!name) {
            return { error: "Name is required" };
        }

        const slug = slugify(name, { lower: true, strict: true });

        // Check if slug exists (Author: Sanket)
        const existing = await (prisma as any).subject.findUnique({
            where: { slug },
        });

        if (existing) {
            return { error: "Subject with this name already exists" };
        }

        await (prisma as any).subject.create({
            data: {
                name,
                slug,
            },
        });

        revalidatePath("/admin/subjects");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        console.error("Create Subject Error:", error);
        return { error: error.message || "Failed to create subject" };
    }
}

export async function updateSubject(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const id = formData.get("id") as string;
        const name = formData.get("name") as string;

        if (!id || !name) {
            return { error: "ID and Name are required" };
        }

        const slug = slugify(name, { lower: true, strict: true });

        // Check duplicate slug excluding current (Author: Sanket)
        const existing = await (prisma as any).subject.findFirst({
            where: {
                slug,
                NOT: { id },
            },
        });

        if (existing) {
            return { error: "Subject with this name already exists" };
        }

        await (prisma as any).subject.update({
            where: { id },
            data: {
                name,
                slug,
            },
        });

        revalidatePath("/admin/subjects");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        return { error: error.message || "Failed to update subject" };
    }
}

export async function deleteSubject(id: string) {
    try {
        await requireAdmin();

        // Check if has associated group classes (Author: Sanket)
        const subject = await (prisma as any).subject.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { groupClasses: true }
                }
            }
        });

        if (!subject) return { error: "Subject not found" };
        if (subject._count.groupClasses > 0) {
            return { error: "Cannot delete subject with associated group classes" };
        }

        await (prisma as any).subject.delete({ where: { id } });
        revalidatePath("/admin/subjects");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getSubjects() {
    try {
        return await (prisma as any).subject.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error("Get Subjects Error:", error);
        return [];
    }
}
