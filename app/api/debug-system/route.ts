import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionWithRole } from "@/app/data/auth/require-roles"; // author: Sanket

export async function GET() {
    // Standard Security Guard - author: Sanket
    const session = await getSessionWithRole();
    if (session?.user?.role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const results = {
        database: { status: "pending", error: null as any },
        email: { status: "pending", error: null as any },
        env: {
            EMAIL_USER: (process.env.EMAIL_USER || "").trim() ? "SET" : "MISSING",
            EMAIL_PASS: (process.env.EMAIL_PASS || "").trim() ? "SET" : "MISSING",
            EMAIL_HOST: (process.env.EMAIL_HOST || "").trim(),
        }
    };

    // 1. Test Database
    try {
        const count = await prisma.user.count();
        results.database = { status: "success", count } as any;
    } catch (error: any) {
        console.error("DB Error:", error);
        results.database = { status: "error", error: error.message };
    }

    // 2. Test Email (ACTUAL SEND)
    try {
        const { sendEmail } = await import("@/lib/email");
        const success = await sendEmail({
            to: (process.env.EMAIL_USER || "").trim(), // Send to self
            subject: "System Debug Test",
            html: "<p>If you get this, sending works.</p>"
        });

        if (success) {
            results.email = { status: "success", message: "Email Sent Successfully" } as any;
        } else {
            results.email = { status: "error", message: "sendEmail returned false (check server logs)" } as any;
        }

    } catch (error: any) {
        console.error("Email Error:", error);
        return NextResponse.json({ status: "error", error: error.message } as any, { status: 500 });
    }

    return NextResponse.json(results, { status: 200 });
}
