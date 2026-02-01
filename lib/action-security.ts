import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

/**
 * Security helpers for KIDOKOOL Server Actions
 * Author: Sanket
 */

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Enforce Admin role for a server action
 * @throws Error if not an admin
 */
export async function requireAdmin() {
  const session = await getSession();
  const user = session?.user as any;
  
  if (!session || user?.role !== "admin") {
    logger.security("Unauthorized admin access attempt", { 
        userId: user?.id,
        role: user?.role
    });
    throw new Error("Unauthorized: Admin access required");
  }
  
  return session;
}

/**
 * Enforce Teacher role for a server action
 * @throws Error if not a teacher or admin
 */
export async function requireTeacher() {
  const session = await getSession();
  const user = session?.user as any;
  
  if (!session || (user?.role !== "teacher" && user?.role !== "admin")) {
    logger.security("Unauthorized teacher access attempt", { 
        userId: user?.id,
        role: user?.role
    });
    throw new Error("Unauthorized: Teacher access required");
  }
  
  return session;
}

/**
 * Enforce any authenticated user
 * @throws Error if not logged in
 */
export async function requireUser() {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized: Please log in to continue");
  }
  
  return session;
}