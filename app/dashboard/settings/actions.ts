"use server";

import { requireUser } from "@/app/data/user/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BOARDS, CURRENT_CLASSES, TARGET_PROGRAMS } from "@/lib/examsphere-taxonomy";

// Empty form fields arrive as "" — store them as null rather than empty strings.
const optionalText = (max: number) =>
    z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optionalChoice = <T extends readonly [string, ...string[]]>(values: T) =>
    z.union([z.enum(values), z.literal("")]).optional().transform((v) => (v ? v : null));
const phone = z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[+\d][\d\s-]{7,15}$/.test(v), { message: "Please enter a valid phone number" })
    .transform((v) => (v ? v : null));

const currentYear = new Date().getFullYear();

// ExamSphere student profile (BUG-0007): programme, class, target year, school details and a
// guardian contact — replacing the generic country / interests / "Learn React" goals fields.
const profileSchema = z.object({
    name: z.string().trim().min(2, "Name is required"),
    image: z.string().optional(),
    targetProgram: optionalChoice(TARGET_PROGRAMS),
    currentClass: optionalChoice(CURRENT_CLASSES),
    targetYear: z
        .union([z.literal(""), z.coerce.number().int().min(currentYear - 1).max(currentYear + 8)], {
            errorMap: () => ({ message: "Please choose a valid target year" }),
        })
        .optional()
        .transform((v) => (v === "" || v === undefined ? null : v)),
    board: optionalChoice(BOARDS),
    institution: optionalText(150),
    city: optionalText(80),
    state: optionalText(80),
    contactPhone: phone,
    guardianName: optionalText(100),
    guardianPhone: phone,
    notifications: z.boolean(),
});

export async function updateProfile(prevState: any, formData: FormData) {
    const user = await requireUser(false);
    if (!user) {
        return { status: "error", message: "Please log in again." };
    }

    const field = (name: string) => (formData.get(name) as string | null) ?? undefined;
    const validation = profileSchema.safeParse({
        name: field("name"),
        image: field("image"),
        targetProgram: field("targetProgram"),
        currentClass: field("currentClass"),
        targetYear: field("targetYear"),
        board: field("board"),
        institution: field("institution"),
        city: field("city"),
        state: field("state"),
        contactPhone: field("contactPhone"),
        guardianName: field("guardianName"),
        guardianPhone: field("guardianPhone"),
        notifications: formData.get("notifications") === "on",
    });

    if (!validation.success) {
        return {
            status: "error",
            message: validation.error.errors[0].message,
        };
    }

    const { name, image, notifications, ...studentDetails } = validation.data;

    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { name, image },
            }),
            prisma.studentProfile.upsert({
                where: { userId: user.id },
                create: { userId: user.id, ...studentDetails },
                update: studentDetails,
            }),
            prisma.userPreferences.upsert({
                where: { userId: user.id },
                // difficulty/topics/languages are required JSON columns without defaults; leaving
                // them out made the first save fail for every student without a preferences row.
                create: {
                    userId: user.id,
                    categories: studentDetails.targetProgram ? [studentDetails.targetProgram] : [],
                    goals: [],
                    topics: [],
                    languages: [],
                    difficulty: [],
                    notifications,
                },
                update: { notifications },
            }),
        ]);

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");

        return {
            status: "success",
            message: "Profile updated successfully",
        };
    } catch (error) {
        console.error("Update profile error:", error);
        return {
            status: "error",
            message: "Failed to update profile",
        };
    }
}
