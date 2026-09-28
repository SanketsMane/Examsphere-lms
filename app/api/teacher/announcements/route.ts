import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user as any).role;
        if (role !== "teacher" && role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const subject = typeof body.subject === "string" ? body.subject.trim() : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";

        if (!subject || !message) {
            return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
        }
        if (subject.length > 200 || message.length > 5000) {
            return NextResponse.json({ error: "Announcement is too long" }, { status: 400 });
        }

        // Only students with an Active enrollment in this teacher's courses.
        const enrollments = await prisma.enrollment.findMany({
            where: { status: "Active", Course: { userId: session.user.id } },
            select: { userId: true },
            distinct: ["userId"],
        });

        const studentIds = enrollments.map((e) => e.userId).filter((id) => id !== session.user.id);

        if (studentIds.length === 0) {
            return NextResponse.json({ message: "You have no enrolled students to notify yet", sent: 0 });
        }

        // Delivered as in-app notifications; there is no bulk email pipeline for announcements.
        await prisma.notification.createMany({
            data: studentIds.map((userId) => ({
                userId,
                title: subject,
                message,
                type: "Course" as const,
                data: { kind: "announcement", teacherId: session.user.id, teacherName: session.user.name },
            })),
        });

        return NextResponse.json({
            message: `Announcement sent to ${studentIds.length} student${studentIds.length === 1 ? "" : "s"} as an in-app notification`,
            sent: studentIds.length,
        });

    } catch (error) {
        console.error("Error sending announcement:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
