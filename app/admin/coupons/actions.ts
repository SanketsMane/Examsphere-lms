"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/action-security";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CouponType } from "@prisma/client";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.nativeEnum(CouponType),
  value: z.number().min(0),
  applicableOn: z.array(z.string()),
  expiryDate: z.string(), // ISO date string
  usageLimit: z.number().min(1),
  perUserLimit: z.number().min(1),
});

async function isAdmin() {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function createCoupon(formData: FormData) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  try {
    const rawData = {
      code: formData.get("code") as string,
      type: formData.get("type") as CouponType,
      value: Number(formData.get("value")),
      applicableOn: (formData.getAll("applicableOn") as string[]) || [],
      expiryDate: formData.get("expiryDate") as string,
      usageLimit: Number(formData.get("usageLimit")),
      perUserLimit: Number(formData.get("perUserLimit")),
    };

    const validated = createCouponSchema.parse(rawData);

    await prisma.coupon.create({
      data: {
        ...validated,
        expiryDate: new Date(validated.expiryDate),
        // teacherId is null for admin-created global coupons
      }
    });

    revalidatePath("/admin/coupons");
  } catch (error) {
    console.error("Create coupon error:", error);
    return { error: "Failed to create coupon" };
  }
  redirect("/admin/coupons");
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
    if (!(await isAdmin())) return { error: "Unauthorized" };
    try {
        await prisma.coupon.update({
            where: { id },
            data: { isActive }
        });
        revalidatePath("/admin/coupons");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update status" };
    }
}

export async function deleteCoupon(id: string) {
    if (!(await isAdmin())) return { error: "Unauthorized" };
    try {
        await prisma.coupon.delete({ where: { id } });
        revalidatePath("/admin/coupons");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete coupon" };
    }
}
