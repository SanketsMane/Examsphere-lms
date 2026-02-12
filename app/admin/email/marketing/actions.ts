"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/action-security";
import { z } from "zod";
import { sendEmail, replacePlaceholders, sendTemplatedEmail } from "@/lib/email";

/**
 * Author: Sanket
 */

const marketingSchema = z.object({
  audience: z.enum(["all", "teachers", "students"]),
  templateId: z.string().min(1, "Template is required"),
});

export async function getTemplates() {
    await requireAdmin();
    return prisma.emailTemplate.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true }
    });
}

export async function sendMarketingEmail(prevState: any, formData: FormData) {
  try {
    await requireAdmin();

    const rawData = {
      audience: formData.get("audience"),
      templateId: formData.get("templateId"),
    };

    const result = marketingSchema.safeParse(rawData);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    const { audience, templateId } = result.data;

    // 1. Fetch Template
    const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
    });

    if (!template) {
        return { error: "Template not found" };
    }

    // 2. Fetch Audience
    let users: { email: string; name: string }[] = [];

    if (audience === "all") {
        users = await prisma.user.findMany({
            where: { 
                email: { not: "" },
                banned: { not: true }
            },
            select: { email: true, name: true }
        });
    } else if (audience === "teachers") {
        users = await prisma.user.findMany({
            where: { 
                role: "teacher", 
                email: { not: "" },
                banned: { not: true }
            },
            select: { email: true, name: true }
        });
    } else if (audience === "students") {
        users = await prisma.user.findMany({
            where: { 
                role: "student", 
                email: { not: "" },
                banned: { not: true }
            },
            select: { email: true, name: true }
        });
    }

    if (users.length === 0) {
        return { error: "No users found in selected audience." };
    }

    // 3. Send Emails with Batching
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        const batch = users.slice(i, i + BATCH_SIZE);
        
        const promises = batch.map(async (user) => {
            try {
                // Determine content and subject with variables
                const vars = { userName: user.name || "User" };
                const subject = replacePlaceholders(template.subject, vars);
                const html = replacePlaceholders(template.content, vars);

                return await sendEmail({
                    to: user.email,
                    subject: subject,
                    html: html
                });
            } catch (e) {
                console.error(`Failed to send marketing email to ${user.email}`, e);
                return false;
            }
        });

        const results = await Promise.all(promises);
        
        results.forEach(sent => {
            if (sent) successCount++;
            else failureCount++;
        });
    }

    return { 
        success: true, 
        message: `Campaign sent! Success: ${successCount}, Failed: ${failureCount}`,
        stats: { success: successCount, failure: failureCount }
    };

  } catch (error) {
    console.error("Marketing Email Error:", error);
    return { error: "Failed to send marketing campaign." };
  }
}
