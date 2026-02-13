"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";
import { sendEmail } from "@/lib/email"; // Using generic email sender, will refine after viewing email-notifications.ts
import { IssueStatus, Priority } from "@prisma/client";

// Admin email configuration - set ADMIN_EMAIL environment variable
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
    console.warn("⚠️  ADMIN_EMAIL environment variable not set. Admin notifications will be disabled.");
}

export async function createIssue(data: {
    subject: string;
    description: string;
    category: string;
    priority: Priority;
    metadata?: any;
}) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    try {
        // QA-081: Rate Limiting (Author: Sanket)
        const lastIssue = await prisma.issue.findFirst({
            where: { reporterId: session.user.id },
            orderBy: { createdAt: "desc" }
        });

        if (lastIssue) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (lastIssue.createdAt > fiveMinutesAgo) {
                return { error: "You are reporting issues too frequently. Please wait a few minutes." };
            }
        }

        const issue = await prisma.issue.create({
            data: {
                reporterId: session.user.id,
                subject: data.subject,
                description: data.description,
                category: data.category,
                priority: data.priority,
                metadata: data.metadata || {},
                status: "Open",
            },
            include: { reporter: true }
        });

        // Notify Admin (only if ADMIN_EMAIL is configured)
        if (ADMIN_EMAIL) {
            try {
                await sendEmail({
                    to: ADMIN_EMAIL,
                    subject: `[New Issue] ${data.subject}`,
                    html: `
                    <h1>New Issue Reported</h1>
                    <p><strong>Reporter:</strong> ${session.user.name} (${session.user.email})</p>
                    <p><strong>Category:</strong> ${data.category}</p>
                    <p><strong>Priority:</strong> ${data.priority}</p>
                    <hr />
                    <p>${data.description}</p>
                `
                });
            } catch (emailError) {
                console.error("Failed to send admin notification", emailError);
            }
        }

        // Notify User
        try {
            await sendEmail({
                to: session.user.email,
                subject: `[Issue Received] ${data.subject}`,
                html: `
                <h1>Issue Received</h1>
                <p>We have received your issue report. Our team will look into it shortly.</p>
                <p><strong>Ticket ID:</strong> ${issue.id}</p>
            `
            });
        } catch (emailError) {
            console.error("Failed to send user notification", emailError);
        }

        revalidatePath("/dashboard/issues");
        return { success: true, issue };
    } catch (error) {
        console.error("Create issue error:", error);
        return { error: "Failed to create issue" };
    }
}

export async function updateIssueStatus(
    issueId: string,
    status: IssueStatus,
    isEscalated: boolean = false
) {
    await requireAdmin();

    try {
        const issue = await prisma.issue.update({
            where: { id: issueId },
            data: {
                status,
                isEscalated
            },
            include: { reporter: true }
        });

        // Notify User of update
        try {
            await sendEmail({
                to: issue.reporter.email,
                subject: `[Issue Update] ${issue.subject}`,
                html: `
                <h1>Issue Updated</h1>
                <p>The status of your issue has been changed to <strong>${status}</strong>.</p>
                ${isEscalated ? "<p><strong style='color:red;'>This issue has been escalated to high priority.</strong></p>" : ""}
            `
            });
        } catch (emailError) {
            console.error("Failed to send update notification", emailError);
        }

        revalidatePath("/admin/issues");
        return { success: true, issue };
    } catch (error) {
        console.error("Update issue error:", error);
        return { error: "Failed to update issue" };
    }
}

export async function escalateIssue(issueId: string) {
    return updateIssueStatus(issueId, "Escalated", true);
}
