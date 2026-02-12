"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";
import { z } from "zod";
import { redirect } from "next/navigation";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-zA-Z0-9]+$/, "Slug must be alphanumeric"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Content is required"),
  isActive: z.boolean().optional(),
});

export async function createTemplate(formData: FormData) {
  try {
    await requireAdmin();

    const rawData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      subject: formData.get("subject"),
      content: formData.get("content"),
      isActive: formData.get("isActive") === "on",
    };

    const result = templateSchema.safeParse(rawData);

    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // Check availability
    const existing = await prisma.emailTemplate.findUnique({
      where: { slug: result.data.slug }
    });

    if (existing) {
      return { error: "A template with this slug already exists." };
    }

    await prisma.emailTemplate.create({
      data: {
        name: result.data.name,
        slug: result.data.slug,
        subject: result.data.subject,
        content: result.data.content,
        isActive: result.data.isActive ?? true,
      }
    });

    revalidatePath("/admin/email/templates");
  } catch (error) {
    console.error("Failed to create template:", error);
    return { error: "Failed to create template." };
  }
  
  redirect("/admin/email/templates");
}
