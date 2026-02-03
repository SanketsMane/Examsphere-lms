"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * API endpoint to fetch free trial usage for teacher
 * Author: Sanket
 */

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get teacher profile
        const teacher = await prisma.teacherProfile.findUnique({
            where: { userId: (session.user as any).id }
        });

        if (!teacher) {
            return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
        }

        // Fetch free trial usages
        const usages = await prisma.freeTrialUsage.findMany({
            where: { teacherId: teacher.id },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true
                    }
                }
            },
            orderBy: { usedAt: 'desc' }
        });

        return NextResponse.json({ usages });
    } catch (error) {
        console.error("Free trials fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch free trial data" },
            { status: 500 }
        );
    }
}
