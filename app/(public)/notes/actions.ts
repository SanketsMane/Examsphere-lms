"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/action-security";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/lib/types";
import { NotePurchaseError, purchaseNoteWithWallet } from "@/lib/notes/purchase";

export async function buyNoteWithWalletAction(noteId: string): Promise<ApiResponse> {
  let session;
  try {
    session = await requireUser();
  } catch {
    return { status: "error", message: "Please sign in to buy notes." };
  }
  try {
    const { slug } = await purchaseNoteWithWallet(session.user as { id: string; role?: string | null }, noteId);
    revalidatePath("/dashboard/notes");
    revalidatePath(`/notes/${slug}`);
    return { status: "success", message: "Notes unlocked!", data: { slug } };
  } catch (err) {
    if (err instanceof NotePurchaseError) return { status: "error", message: err.message };
    // deductFromWallet reports a short balance as a plain Error with a readable message.
    if (err instanceof Error && err.message.startsWith("Insufficient balance")) {
      return { status: "error", message: err.message };
    }
    logger.error("NOTE_WALLET_PURCHASE_ERROR", err as Error, session.user.id);
    return { status: "error", message: "Could not complete the purchase. Your wallet was not charged." };
  }
}
