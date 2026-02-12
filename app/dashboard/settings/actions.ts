"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const profileSchema = z.object({
    name: z.string().min(2, "Name is required"),
    bio: z.string().optional(),
    education: z.string().optional(),
    image: z.string().optional(),
    categories: z.array(z.string()).optional(),
    goals: z.string().optional(),
    notifications: z.boolean().optional(),
    country: z.string().optional(), // Added for localization - Author: Sanket
});

export async function updateProfile(prevState: any, formData: FormData) {
    const user = await requireUser();

    const data = {
        name: formData.get("name") as string,
        bio: formData.get("bio") as string,
        education: formData.get("education") as string,
        image: formData.get("image") as string,
        categories: formData.getAll("categories") as string[],
        goals: formData.get("goals") as string,
        notifications: formData.get("notifications") === "on",
        country: formData.get("country") as string, // Added for localization - Author: Sanket
    };

    const validation = profileSchema.safeParse(data);

    if (!validation.success) {
        return {
            status: "error",
            message: validation.error.errors[0].message,
        };
    }

    try {
        // Split goals by comma and trim
        const goalsArray = validation.data.goals
            ? validation.data.goals.split(",").map(g => g.trim()).filter(g => g !== "")
            : [];

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    name: validation.data.name,
                    bio: validation.data.bio,
                    education: validation.data.education,
                    image: validation.data.image,
                    country: validation.data.country, // Added for localization - Author: Sanket
                },
            }),
            prisma.userPreferences.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    categories: validation.data.categories || [],
                    goals: goalsArray,
                    notifications: validation.data.notifications ?? true,
                },
                update: {
                    categories: validation.data.categories || [],
                    goals: goalsArray,
                    notifications: validation.data.notifications ?? true,
                },
            }),
        ]);

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");

        return {
            status: "success",
            message: "Profile and preferences updated successfully",
        };
    } catch (error) {
        console.error("Update profile error:", error);
        return {
            status: "error",
            message: "Failed to update profile",
        };
    }
}
