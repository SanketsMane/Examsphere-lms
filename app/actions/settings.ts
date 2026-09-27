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
 * Admin: settings for the settings form.
 *
 * Razorpay secrets never leave the server: the form only learns whether one is
 * saved, and an empty submission keeps it.
 */
export async function getAdminSiteSettings() {
    await requireAdmin();
    const settings = await prisma.siteSettings.findFirst();
    if (!settings) return null;

    const { razorpayKeySecret, razorpayWebhookSecret, ...rest } = settings;
    return {
        ...rest,
        hasRazorpayKeySecret: Boolean(razorpayKeySecret),
        hasRazorpayWebhookSecret: Boolean(razorpayWebhookSecret),
    };
}

export type AdminSiteSettings = NonNullable<Awaited<ReturnType<typeof getAdminSiteSettings>>>;

const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trimmed value, or null when blank, so "" never lands in the DB. */
function text(formData: FormData, key: string): string | null {
    const value = formData.get(key);
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
}

/** Accept "instagram.com/x" as well as full URLs; reject anything unparseable. */
function normaliseUrl(value: string | null, label: string): string | null {
    if (!value) return null;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    let parsed: URL;
    try {
        parsed = new URL(withScheme);
    } catch {
        throw new SettingsValidationError(`${label} must be a valid URL`);
    }
    if (!parsed.hostname.includes(".")) {
        throw new SettingsValidationError(`${label} must be a valid URL`);
    }
    return parsed.toString();
}

function parseJsonField(formData: FormData, key: string): unknown | undefined {
    const raw = formData.get(key);
    if (typeof raw !== "string" || raw.trim() === "") return undefined;
    try {
        return JSON.parse(raw);
    } catch {
        throw new SettingsValidationError(`Invalid ${key} data`);
    }
}

class SettingsValidationError extends Error {}

export async function updateSiteSettings(prevState: any, formData: FormData) {
    try {
        await requireAdmin();

        const contactEmail = text(formData, "contactEmail");
        if (contactEmail && !EMAIL_RE.test(contactEmail)) {
            return { success: false, error: "Contact email is not a valid email address" };
        }

        const contactPhone = text(formData, "contactPhone");
        if (contactPhone && !PHONE_RE.test(contactPhone)) {
            return { success: false, error: "Contact phone may only contain digits, spaces, ( ) - and a leading +" };
        }

        const siteUrl = normaliseUrl(text(formData, "siteUrl"), "Site URL");
        const facebook = normaliseUrl(text(formData, "facebook"), "Facebook link");
        const twitter = normaliseUrl(text(formData, "twitter"), "X (Twitter) link");
        const instagram = normaliseUrl(text(formData, "instagram"), "Instagram link");
        const linkedin = normaliseUrl(text(formData, "linkedin"), "LinkedIn link");
        const youtube = normaliseUrl(text(formData, "youtube"), "YouTube link");

        const logoSize = Math.min(100, Math.max(0, parseInt(formData.get("logoSize") as string) || 100));
        const maxGroupClassSize = Math.max(1, parseInt(formData.get("maxGroupClassSize") as string) || 12);

        const footerLinks = parseJsonField(formData, "footerLinks");
        const currencyRates = parseJsonField(formData, "currencyRates");

        const razorpayKeyId = text(formData, "razorpayKeyId");
        const razorpayKeySecret = text(formData, "razorpayKeySecret");
        const razorpayWebhookSecret = text(formData, "razorpayWebhookSecret");
        const clearRazorpaySecrets = formData.get("clearRazorpaySecrets") === "on";

        const data = {
            siteName: text(formData, "siteName") ?? "ExamSphere",
            siteUrl: siteUrl ?? "",
            logo: text(formData, "logo"),
            favicon: text(formData, "favicon"),
            logoSize,
            // Prices, wallets and payouts are all stored and charged in rupees.
            currencyCode: "INR",
            currencySymbol: "₹",
            contactEmail,
            contactPhone,
            contactAddress: text(formData, "contactAddress"),
            facebook,
            twitter,
            instagram,
            linkedin,
            youtube,
            maxGroupClassSize,
            razorpayKeyId,
        };

        const existing = await prisma.siteSettings.findFirst({ select: { id: true } });

        if (existing) {
            await prisma.siteSettings.update({
                where: { id: existing.id },
                data: {
                    ...data,
                    ...(footerLinks !== undefined ? { footerLinks: footerLinks as any } : {}),
                    ...(currencyRates !== undefined ? { currencyRates: currencyRates as any } : {}),
                    // Blank secret inputs mean "unchanged", so clearing needs an explicit flag.
                    ...(clearRazorpaySecrets
                        ? { razorpayKeySecret: null, razorpayWebhookSecret: null }
                        : {
                              ...(razorpayKeySecret ? { razorpayKeySecret } : {}),
                              ...(razorpayWebhookSecret ? { razorpayWebhookSecret } : {}),
                          }),
                },
            });
        } else {
            await prisma.siteSettings.create({
                data: {
                    ...data,
                    footerLinks: (footerLinks ?? {}) as any,
                    currencyRates: (currencyRates ?? {}) as any,
                    razorpayKeySecret: clearRazorpaySecrets ? null : razorpayKeySecret,
                    razorpayWebhookSecret: clearRazorpaySecrets ? null : razorpayWebhookSecret,
                },
            });
        }

        revalidatePath("/", "layout");
        revalidatePath("/contact");
        revalidatePath("/admin/settings");
        return { success: true, message: "Settings updated successfully" };
    } catch (error: any) {
        if (error instanceof SettingsValidationError) {
            return { success: false, error: error.message };
        }
        console.error("Failed to update site settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
