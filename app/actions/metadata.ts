"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";
import { EXPERTISE_AREAS, TEACHING_LANGUAGES } from "@/lib/examsphere-taxonomy";

// --- Expertise Actions ---

export async function createExpertise(name: string) {
    try {
        await requireAdmin();
        const existing = await prisma.expertise.findUnique({
            where: { name },
        });

        if (existing) {
            if (!existing.isActive) {
                // Reactivate if it exists but inactive
                await prisma.expertise.update({
                    where: { id: existing.id },
                    data: { isActive: true },
                });
                revalidatePath("/admin/metadata");
                revalidatePath("/register/teacher");
                return { success: true, message: "Expertise reactivated successfully" };
            }
            return { success: false, error: "Expertise already exists" };
        }

        await prisma.expertise.create({
            data: { name },
        });

        revalidatePath("/admin/metadata");
        revalidatePath("/register/teacher");
        return { success: true, message: "Expertise created successfully" };
    } catch (error) {
        console.error("Error creating expertise:", error);
        return { success: false, error: "Failed to create expertise" };
    }
}

export async function deleteExpertise(id: string) {
    try {
        await requireAdmin();
        // Soft delete usually better, but for now hard delete or deactivate
        // Let's hard delete for simplicity as per requirements, or verify usage.
        // If we delete, we might break profiles. Let's just delete for now as requested "manage list".
        // Or better, check if used? Schema doesn't enforce relation on TeacherProfile.expertise (String[]).

        await prisma.expertise.delete({
            where: { id },
        });

        revalidatePath("/admin/metadata");
        revalidatePath("/register/teacher");
        return { success: true, message: "Expertise deleted successfully" };
    } catch (error) {
        console.error("Error deleting expertise:", error);
        return { success: false, error: "Failed to delete expertise" };
    }
}

// --- Language Actions ---

export async function createLanguage(name: string) {
    try {
        await requireAdmin();
        const existing = await prisma.language.findUnique({
            where: { name },
        });

        if (existing) {
            if (!existing.isActive) {
                await prisma.language.update({
                    where: { id: existing.id },
                    data: { isActive: true },
                });
                revalidatePath("/admin/metadata");
                revalidatePath("/register/teacher");
                return { success: true, message: "Language reactivated successfully" };
            }
            return { success: false, error: "Language already exists" };
        }

        await prisma.language.create({
            data: { name },
        });

        revalidatePath("/admin/metadata");
        revalidatePath("/register/teacher");
        return { success: true, message: "Language created successfully" };
    } catch (error) {
        console.error("Error creating language:", error);
        return { success: false, error: "Failed to create language" };
    }
}

export async function deleteLanguage(id: string) {
    try {
        await requireAdmin();
        await prisma.language.delete({
            where: { id },
        });

        revalidatePath("/admin/metadata");
        revalidatePath("/register/teacher");
        return { success: true, message: "Language deleted successfully" };
    } catch (error) {
        console.error("Error deleting language:", error);
        return { success: false, error: "Failed to delete language" };
    }
}

// --- Getter Actions (can also use direct prisma in server components) ---
export async function getMetadata() {
    const [expertise, languages] = await Promise.all([
        prisma.expertise.findMany({
            orderBy: { name: "asc" },
            where: { isActive: true }
        }),
        prisma.language.findMany({
            orderBy: { name: "asc" },
            where: { isActive: true }
        }),
    ]);
    return { expertise, languages };
}

// Options for the teacher signup form: the admin-managed lists, falling back to ExamSphere's
// defaults when a list is empty or unreadable. Signup requires at least one of each, so an
// empty list must never reach the form — it made registration impossible (BUG-0008).
export async function getTeacherSignupOptions() {
    const [expertise, languages] = await Promise.all([
        prisma.expertise
            .findMany({ orderBy: { name: "asc" }, where: { isActive: true }, select: { id: true, name: true } })
            .catch((error) => {
                console.error("Error loading expertise:", error);
                return [];
            }),
        prisma.language
            .findMany({ orderBy: { name: "asc" }, where: { isActive: true }, select: { id: true, name: true } })
            .catch((error) => {
                console.error("Error loading languages:", error);
                return [];
            }),
    ]);
    return {
        expertise: expertise.length ? expertise : EXPERTISE_AREAS.map((name) => ({ id: name, name })),
        languages: languages.length ? languages : TEACHING_LANGUAGES.map((name) => ({ id: name, name })),
    };
}
