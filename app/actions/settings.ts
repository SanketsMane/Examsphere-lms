"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";


export async function getSiteSettings() {
    const settings = await prisma.siteSettings.findFirst();
    return settings;
}

export async function updateSiteSettings(prevState: any, formData: FormData) {
    try {
        await requireAdmin();

        const siteName = formData.get("siteName") as string;
        const siteUrl = formData.get("siteUrl") as string;
        const logo = formData.get("logo") as string;

        // Contact
        const contactEmail = formData.get("contactEmail") as string;
        const contactPhone = formData.get("contactPhone") as string;
        const contactAddress = formData.get("contactAddress") as string;

        // Social
        const facebook = formData.get("facebook") as string;
        const twitter = formData.get("twitter") as string;
        const instagram = formData.get("instagram") as string;
        const linkedin = formData.get("linkedin") as string;
        const youtube = formData.get("youtube") as string;
        const maxGroupClassSize = parseInt(formData.get("maxGroupClassSize") as string) || 12;

        const razorpayKeyId = formData.get("razorpayKeyId") as string;
        const razorpayKeySecret = formData.get("razorpayKeySecret") as string;

        const existing = await prisma.siteSettings.findFirst();

        if (existing) {
            await prisma.siteSettings.update({
                where: { id: existing.id },
                data: {
                    siteName,
                    siteUrl,
                    logo,
                    contactEmail,
                    contactPhone,
                    contactAddress,
                    facebook,
                    twitter,
                    instagram,
                    linkedin,
                    youtube,
                    footerLinks: JSON.parse(formData.get("footerLinks") as string || "{}"),
                    maxGroupClassSize,
                },
            });
        } else {
            await prisma.siteSettings.create({
                data: {
                    siteName: siteName || "Kidokool LMS",
                    siteUrl: siteUrl || "",
                    logo,
                    contactEmail,
                    contactPhone,
                    contactAddress,
                    facebook,
                    twitter,
                    instagram,
                    linkedin,
                    youtube,
                    footerLinks: JSON.parse(formData.get("footerLinks") as string || "{}"),
                    maxGroupClassSize,
                },
            });
        }

        revalidatePath("/");
        revalidatePath("/admin/settings");
        return { success: true, message: "Settings updated successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to update settings" };
    }
}
