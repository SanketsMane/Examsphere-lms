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

function readDisplayOrder(formData: FormData): number | undefined {
    const raw = formData.get("displayOrder");
    if (typeof raw !== "string" || raw.trim() === "") return undefined;
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : undefined;
}

/**
 * Categories are two levels deep (exam → sub-category). Allowing any category as a
 * parent let an admin nest under a child or under itself, which listings can't render
 * and which could form a cycle.
 */
async function validateParent(parentId: string | null, selfId?: string): Promise<string | null> {
    if (!parentId) return null;
    if (parentId === selfId) return "A category cannot be its own parent";

    const parent = await prisma.category.findUnique({
        where: { id: parentId },
        select: { parentId: true },
    });
    if (!parent) return "Parent category not found";
    if (parent.parentId) return "Parent must be a top-level category";

    if (selfId) {
        const childCount = await prisma.category.count({ where: { parentId: selfId } });
        if (childCount > 0) return "A category with sub-categories cannot be moved under another category";
    }
    return null;
}

function readParentId(formData: FormData): string | null {
    const raw = formData.get("parentId");
    return typeof raw === "string" && raw && raw !== "null" ? raw : null;
}

export async function createCategory(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const name = ((formData.get("name") as string) || "").trim();
        const description = ((formData.get("description") as string) || "").trim() || null;
        const parentId = readParentId(formData);
        const icon = ((formData.get("icon") as string) || "").trim() || null;
        const image = ((formData.get("image") as string) || "").trim() || null;
        const displayOrder = readDisplayOrder(formData);
        const subCategoryNames = formData.getAll("subCategoryNames") as string[];

        if (!name) {
            return { error: "Name is required" };
        }

        const parentError = await validateParent(parentId);
        if (parentError) return { error: parentError };

        const slug = slugify(name, { lower: true, strict: true });

        // Check if slug exists
        const existing = await prisma.category.findFirst({
            where: { OR: [{ slug }, { name }] },
        });

        if (existing) {
            return { error: "Category with this name already exists" };
        }

        const subCategories = subCategoryNames.filter(n => n.trim() !== "");

        await prisma.$transaction(async (tx) => {
            const parent = await tx.category.create({
                data: {
                    name,
                    slug,
                    description,
                    icon,
                    image,
                    parentId,
                    ...(displayOrder !== undefined ? { displayOrder } : {}),
                },
            });

            // Sub-categories can only hang off a top-level category.
            if (!parentId && subCategories.length > 0) {
                for (const subName of subCategories) {
                    const trimmedName = subName.trim();
                    if (!trimmedName) continue;
                    const subSlug = slugify(trimmedName, { lower: true, strict: true });
                    
                    // Check if name or slug exists
                    const subExisting = await tx.category.findFirst({ 
                        where: { 
                            OR: [
                                { slug: subSlug },
                                { name: trimmedName }
                            ]
                        } 
                    });

                    if (!subExisting) {
                        await tx.category.create({
                            data: {
                                name: trimmedName,
                                slug: subSlug,
                                parentId: parent.id,
                                isActive: true
                            }
                        });
                    }
                }
            }
        });

        revalidatePath("/admin/categories");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        console.error("Create Category Error:", error);
        return { error: error.message || "Failed to create category" };
    }
}

export async function updateCategory(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const id = formData.get("id") as string;
        const name = ((formData.get("name") as string) || "").trim();
        const description = ((formData.get("description") as string) || "").trim() || null;
        const parentId = readParentId(formData);
        const icon = ((formData.get("icon") as string) || "").trim() || null;
        const image = ((formData.get("image") as string) || "").trim() || null;
        const displayOrder = readDisplayOrder(formData);

        if (!id || !name) {
            return { error: "ID and Name are required" };
        }

        const current = await prisma.category.findUnique({
            where: { id },
            select: { name: true },
        });
        if (!current) return { error: "Category not found" };

        const duplicate = await prisma.category.findFirst({
            where: { name, NOT: { id } },
        });
        if (duplicate) {
            return { error: "Category with this name already exists" };
        }

        const parentError = await validateParent(parentId, id);
        if (parentError) return { error: parentError };

        // Slug is intentionally left unchanged: it is used in public URLs and filters,
        // and renaming should not break existing links.
        await prisma.$transaction(async (tx) => {
            await tx.category.update({
                where: { id },
                data: {
                    name,
                    description,
                    icon,
                    image,
                    parentId,
                    ...(displayOrder !== undefined ? { displayOrder } : {}),
                },
            });

            // Course.category stores the category *name*; keep existing courses attached.
            if (current.name !== name) {
                await tx.course.updateMany({
                    where: { category: current.name },
                    data: { category: name },
                });
            }
        });

        revalidatePath("/admin/categories");
        revalidatePath("/courses");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        console.error("Update Category Error:", error);
        return { error: "Failed to update category" };
    }
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
    try {
        await requireAdmin();
        await prisma.category.update({ where: { id }, data: { isActive } });
        revalidatePath("/admin/categories");
        revalidatePath("/courses");
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error("Toggle Category Error:", error);
        return { error: "Failed to update category status" };
    }
}

export async function deleteCategory(id: string) {
    try {
        await requireAdmin();
        // Check if has children or courses
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { courses: true, children: true }
                }
            }
        });

        if (!category) return { error: "Category not found" };
        if (category._count.courses > 0) return { error: "Cannot delete category with associated courses" };
        if (category._count.children > 0) return { error: "Cannot delete category with subcategories" };

        await prisma.category.delete({ where: { id } });
        revalidatePath("/admin/categories");
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
