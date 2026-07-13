"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { revalidatePath } from "next/cache";
import { INQUIRY_STATUSES, type InquiryStatus } from "./constants";

export async function updateInquiryStatus(id: string, status: string) {
  await requireAdmin();
  if (!INQUIRY_STATUSES.includes(status as InquiryStatus)) {
    return { error: "Invalid status" };
  }
  try {
    await prisma.chatInquiry.update({ where: { id }, data: { status } });
    revalidatePath("/admin/inquiries");
    revalidatePath(`/admin/inquiries/${id}`);
    return { success: true };
  } catch (e: any) {
    return { error: e?.message || "Failed to update status" };
  }
}

export async function updateInquiryNotes(id: string, notes: string) {
  await requireAdmin();
  try {
    await prisma.chatInquiry.update({ where: { id }, data: { notes: notes.slice(0, 5000) } });
    revalidatePath(`/admin/inquiries/${id}`);
    return { success: true };
  } catch (e: any) {
    return { error: e?.message || "Failed to save notes" };
  }
}

export async function deleteInquiry(id: string) {
  await requireAdmin();
  try {
    await prisma.chatInquiry.delete({ where: { id } });
    revalidatePath("/admin/inquiries");
    return { success: true };
  } catch (e: any) {
    return { error: e?.message || "Failed to delete inquiry" };
  }
}
