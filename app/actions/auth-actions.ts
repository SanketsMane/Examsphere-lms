"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function setTeacherRole() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Conditional update so this self-service action can only promote a plain
    // user/student; it must never downgrade an admin (or touch any other role).
    const updated = await prisma.user.updateMany({
        where: {
            id: session.user.id,
            OR: [{ role: null }, { role: { in: ["user", "student"] } }],
        },
        data: { role: "teacher" },
    });

    if (updated.count === 0) {
        const current = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });
        if (current?.role !== "teacher" && current?.role !== "admin") {
            throw new Error("This account cannot be switched to a teacher account");
        }
    }

    return { success: true };
}
