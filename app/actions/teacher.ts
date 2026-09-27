"use server";

import { requireAdmin } from "@/lib/action-security";
import { decideTeacher } from "@/app/admin/_lib/teacher-approval";

// Verification Center entry points; same service as Admin → Teachers.

export async function approveTeacher(profileId: string) {
    let adminId: string;
    try {
        adminId = (await requireAdmin()).user.id;
    } catch {
        return { success: false, message: "Unauthorized" };
    }
    return decideTeacher({ profileId }, { decision: "approve" }, adminId);
}

export async function rejectTeacher(profileId: string, reason: string) {
    let adminId: string;
    try {
        adminId = (await requireAdmin()).user.id;
    } catch {
        return { success: false, message: "Unauthorized" };
    }
    return decideTeacher({ profileId }, { decision: "reject", reason }, adminId);
}
