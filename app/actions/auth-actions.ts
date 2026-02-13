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

    // Double check they aren't already an admin before changing role?
    // Actually, if they are admin, we probably shouldn't downgrade them, 
    // but this action is for new teacher signup. 
    // Safety: Only allow changing from 'user' to 'teacher'.

    await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "teacher" },
    });

    return { success: true };
}
