"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/action-security";

/**
 * Update platform financial settings
 * @author Sanket
 */
export async function updateFinanceSettings(prevState: any, formData: FormData) {
    try {
        await requireAdmin();

        const commissionPercentage = parseFloat(formData.get("commissionPercentage") as string) || 20.0;
        const gstPercentage = parseFloat(formData.get("gstPercentage") as string) || 0.0;
        const minWalletRecharge = parseFloat(formData.get("minWalletRecharge") as string) || 100.0;
        const currencyCode = formData.get("currencyCode") as string || "INR";
        const currencySymbol = formData.get("currencySymbol") as string || "₹";

        const existing = await prisma.siteSettings.findFirst();

        if (existing) {
            await (prisma.siteSettings as any).update({
                where: { id: existing.id },
                data: {
                    commissionPercentage,
                    gstPercentage,
                    minWalletRecharge,
                    currencyCode,
                    currencySymbol,
                } as any,
            });
        } else {
            // Should not happen if settings are initialized, but for safety:
            await (prisma.siteSettings as any).create({
                data: {
                    siteName: "Kidokool LMS",
                    siteUrl: "",
                    commissionPercentage,
                    gstPercentage,
                    minWalletRecharge,
                    currencyCode,
                    currencySymbol,
                } as any,
            });
        }

        revalidatePath("/admin/finance");
        revalidatePath("/admin/settings");
        return { success: true, message: "Financial settings updated successfully" };
    } catch (error: any) {
        return { error: error.message || "Failed to update financial settings" };
    }
}
