import "server-only";

import { prisma } from "@/lib/db";

export const ALLOWED_ROLES = ["student", "teacher", "admin"] as const;
export type AppRole = (typeof ALLOWED_ROLES)[number];

/** Lower-cased role if it is one we support, else null. Arbitrary strings used to be stored as-is. */
export function normaliseRole(role: unknown): AppRole | null {
    if (typeof role !== "string") return null;
    const value = role.trim().toLowerCase();
    return (ALLOWED_ROLES as readonly string[]).includes(value) ? (value as AppRole) : null;
}

type TargetChange = "delete" | "suspend" | { role: AppRole };

/**
 * Guards destructive account changes.
 *
 * @returns an error message, or null when the change is allowed.
 * - An admin cannot demote, suspend or delete themselves (easy to lock yourself out).
 * - The last active admin can never lose admin access, whoever does it.
 */
export async function checkAccountChange(
    actorId: string,
    targetId: string,
    change: TargetChange
): Promise<string | null> {
    const target = await prisma.user.findUnique({
        where: { id: targetId },
        select: { role: true, banned: true },
    });
    if (!target) return "User not found";

    const removesAdmin =
        target.role === "admin" &&
        (change === "delete" || change === "suspend" || change.role !== "admin");

    if (!removesAdmin) return null;

    if (actorId === targetId) {
        if (change === "delete") return "You cannot delete your own account";
        if (change === "suspend") return "You cannot suspend your own account";
        return "You cannot remove your own admin role";
    }

    const otherActiveAdmins = await prisma.user.count({
        where: { role: "admin", NOT: { id: targetId }, OR: [{ banned: false }, { banned: null }] },
    });
    if (otherActiveAdmins === 0) {
        return "This is the last active admin. Promote another admin first.";
    }

    return null;
}
