"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/action-security";

export async function createResource(data: {
    title: string;
    description?: string;
    fileUrl: string;
    fileType?: string;
    size?: number;
    courseId?: string;
}) {
    try {
        // Strict Role Check (Author: Sanket)
        await requireTeacher();

        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) throw new Error("Unauthorized");

        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacher) throw new Error("Teacher profile not found");

        const resource = await prisma.resource.create({
            data: {
                title: data.title,
                description: data.description,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                size: data.size,
                teacherId: teacher.id,
                courseId: data.courseId === "none" ? undefined : data.courseId,
            }
        });

        revalidatePath("/teacher/resources");
        return { success: true, resource };
    } catch (error) {
        console.error("Failed to create resource:", error);
        return { error: "Failed to create resource" };
    }
}

export async function getTeacherResources() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) return [];

        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacher) return [];

        const resources = await prisma.resource.findMany({
            where: { teacherId: teacher.id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return resources;
    } catch (error) {
        console.error("Failed to fetch resources:", error);
        return [];
    }
}

export async function deleteResource(resourceId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.id) throw new Error("Unauthorized");

        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: session.user.id }
        });

        if (!teacher) throw new Error("Unauthorized");

        // Verify ownership
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId }
        });

        if (!resource || resource.teacherId !== teacher.id) {
            throw new Error("Resource not found or unauthorized");
        }

        // Reclaim storage
        if (resource.size) {
            await prisma.user.update({
                where: { id: teacher.userId },
                data: {
                    storageUsed: {
                        decrement: resource.size
                    }
                }
            });
        }

        await prisma.resource.delete({
            where: { id: resourceId }
        });

        revalidatePath("/teacher/resources");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete resource:", error);
        return { error: "Failed to delete resource" };
    }
}
