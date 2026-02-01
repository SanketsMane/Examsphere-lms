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


export async function createCategory(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await requireAdmin();

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const parentId = formData.get("parentId") as string;
        const icon = formData.get("icon") as string;
        const image = formData.get("image") as string;
        const subCategoryNames = formData.getAll("subCategoryNames") as string[];

        if (!name) {
            return { error: "Name is required" };
        }

        const slug = slugify(name, { lower: true, strict: true });

        // Check if slug exists
        const existing = await prisma.category.findUnique({
            where: { slug },
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
                    parentId: parentId && parentId !== "null" ? parentId : null,
                },
            });

            if (subCategories.length > 0) {
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
                        console.log("Creating sub-category:", trimmedName);
                        await tx.category.create({
                            data: {
                                name: trimmedName,
                                slug: subSlug,
                                parentId: parent.id,
                                isActive: true
                            }
                        });
                    } else {
                        console.log("Sub-category name or slug already exists, skipping:", trimmedName);
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
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const parentId = formData.get("parentId") as string;
        const icon = formData.get("icon") as string;
        const image = formData.get("image") as string;

        if (!id || !name) {
            return { error: "ID and Name are required" };
        }

        const slug = slugify(name, { lower: true, strict: true });

        // Check duplicate slug excluding current
        const existing = await prisma.category.findFirst({
            where: {
                slug,
                NOT: { id },
            },
        });

        if (existing) {
            return { error: "Category with this name already exists" };
        }

        await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                icon,
                image,
                parentId: parentId && parentId !== "null" ? parentId : null,
            },
        });

        revalidatePath("/admin/categories");
        return { success: true, timestamp: Date.now() };
    } catch (error: any) {
        return { error: error.message || "Failed to update category" };
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
