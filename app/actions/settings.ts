"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";


export async function getSiteSettings() {
    const settings = await (prisma.siteSettings as any).findFirst({
        select: {
            id: true,
            siteName: true,
            siteUrl: true,
            logo: true,
            favicon: true,
            logoSize: true,
            currencyCode: true,
            currencySymbol: true,
            contactEmail: true,
            contactPhone: true,
            contactAddress: true,
            facebook: true,
            twitter: true,
            instagram: true,
            linkedin: true,
            youtube: true,
            footerLinks: true,
            maxGroupClassSize: true,
            minWalletRecharge: true,
            currencyRates: true, // Author: Sanket
            // Razorpay secrets EXCLUDED from public select - Author: Sanket
        }
    });
    return settings;
}

/**
 * Admin: Get all site settings including secrets
 * Author: Sanket
 */
export async function getAdminSiteSettings() {
    await requireAdmin();
    return await prisma.siteSettings.findFirst();
}

export async function updateSiteSettings(prevState: any, formData: FormData) {
    try {
        await requireAdmin();

        const siteName = formData.get("siteName") as string;
        const siteUrl = formData.get("siteUrl") as string;
        const logo = formData.get("logo") as string;
        const favicon = formData.get("favicon") as string;
        const logoSize = parseInt(formData.get("logoSize") as string) || 100;

        // Localization
        const currencyCode = formData.get("currencyCode") as string || "INR";
        const currencySymbol = formData.get("currencySymbol") as string || "₹";

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

        /**
         * Author: Sanket
         */
        if (existing) {
            await (prisma.siteSettings as any).update({
                where: { id: existing.id },
                data: {
                    siteName,
                    siteUrl,
                    logo,
                    favicon,
                    logoSize,
                    currencyCode,
                    currencySymbol,
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
                    razorpayKeyId,
                    razorpayKeySecret,
                    razorpayWebhookSecret: formData.get("razorpayWebhookSecret") as string,
                    currencyRates: JSON.parse(formData.get("currencyRates") as string || "{}"), // Author: Sanket
                } as any,
            });
        } else {
            await (prisma.siteSettings as any).create({
                data: {
                    siteName: siteName || "Kidokool LMS",
                    siteUrl: siteUrl || "",
                    logo,
                    favicon,
                    logoSize,
                    currencyCode,
                    currencySymbol,
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
                    razorpayKeyId, 
                    razorpayKeySecret,
                    razorpayWebhookSecret: formData.get("razorpayWebhookSecret") as string
                } as any,
            });
        }

        revalidatePath("/");
        revalidatePath("/admin/settings");
        return { success: true, message: "Settings updated successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to update settings" };
    }
}
