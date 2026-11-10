"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/action-security";
import { toFieldErrors } from "@/lib/course-write";
import { logger } from "@/lib/logger";
import type { ApiResponse } from "@/lib/types";
import { noteFormSchema, type NoteFormInput } from "@/lib/notes/validation";
import {
  createNote,
  deleteNote,
  NoteAdminError,
  setCourseLinks,
  setNoteStatus,
  updateNote,
} from "@/lib/notes/admin";
import { grantNoteAccess, NotePurchaseError, refundNotePurchase, revokeNoteAccess } from "@/lib/notes/purchase";

function fail(err: unknown, action: string): ApiResponse {
  if (err instanceof NoteAdminError) {
    return { status: "error", message: err.message, ...(err.field ? { fieldErrors: { [err.field]: err.message } } : {}) };
  }
  if (err instanceof NotePurchaseError) return { status: "error", message: err.message };
  logger.error(`admin.notes.${action} failed`, { error: err instanceof Error ? err.message : String(err) });
  return { status: "error", message: "Something went wrong. Please try again." };
}

function refresh(noteId?: string) {
  revalidatePath("/admin/notes");
  revalidatePath("/notes");
  if (noteId) revalidatePath(`/admin/notes/${noteId}`);
}

export async function createNoteAction(values: NoteFormInput): Promise<ApiResponse> {
  const session = await requireAdmin();
  const parsed = noteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }
  try {
    const note = await createNote(session.user.id, parsed.data);
    refresh(note.id);
    return { status: "success", message: "Note created. Now upload the PDF.", data: { id: note.id } };
  } catch (err) {
    return fail(err, "create");
  }
}

export async function updateNoteAction(noteId: string, values: NoteFormInput): Promise<ApiResponse> {
  await requireAdmin();
  const parsed = noteFormSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Please correct the highlighted fields.", fieldErrors: toFieldErrors(parsed.error) };
  }
  try {
    await updateNote(noteId, parsed.data);
    refresh(noteId);
    return { status: "success", message: "Saved." };
  } catch (err) {
    return fail(err, "update");
  }
}

export async function setNoteStatusAction(noteId: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED"): Promise<ApiResponse> {
  await requireAdmin();
  if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) return { status: "error", message: "Invalid status." };
  try {
    await setNoteStatus(noteId, status);
    refresh(noteId);
    const label = { DRAFT: "moved to draft", PUBLISHED: "published", ARCHIVED: "archived" }[status];
    return { status: "success", message: `Note ${label}.` };
  } catch (err) {
    return fail(err, "status");
  }
}

const linksSchema = z.array(z.object({ courseId: z.string().min(1), includedWithCourse: z.boolean() })).max(100);

export async function setCourseLinksAction(
  noteId: string,
  links: { courseId: string; includedWithCourse: boolean }[]
): Promise<ApiResponse> {
  await requireAdmin();
  const parsed = linksSchema.safeParse(links);
  if (!parsed.success) return { status: "error", message: "Invalid course selection." };
  try {
    await setCourseLinks(noteId, parsed.data);
    refresh(noteId);
    return { status: "success", message: "Course links saved." };
  } catch (err) {
    return fail(err, "links");
  }
}

export async function grantNoteAccessAction(noteId: string, email: string): Promise<ApiResponse> {
  const session = await requireAdmin();
  const parsed = z.email().safeParse(email.trim());
  if (!parsed.success) return { status: "error", message: "Enter a valid email." };
  try {
    await grantNoteAccess(session.user.id, noteId, parsed.data);
    refresh(noteId);
    return { status: "success", message: "Access granted." };
  } catch (err) {
    return fail(err, "grant");
  }
}

export async function revokeNoteAccessAction(noteId: string, entitlementId: string, reason: string): Promise<ApiResponse> {
  await requireAdmin();
  try {
    await revokeNoteAccess(entitlementId, reason || "Revoked by admin");
    refresh(noteId);
    return { status: "success", message: "Access removed." };
  } catch (err) {
    return fail(err, "revoke");
  }
}

export async function refundNotePurchaseAction(noteId: string, entitlementId: string, reason: string): Promise<ApiResponse> {
  await requireAdmin();
  try {
    await refundNotePurchase(entitlementId, reason || "Refunded by admin");
    refresh(noteId);
    return { status: "success", message: "Refunded and access removed." };
  } catch (err) {
    return fail(err, "refund");
  }
}

export async function deleteNoteAction(noteId: string): Promise<ApiResponse> {
  await requireAdmin();
  try {
    await deleteNote(noteId);
    refresh();
    return { status: "success", message: "Note deleted." };
  } catch (err) {
    return fail(err, "delete");
  }
}
