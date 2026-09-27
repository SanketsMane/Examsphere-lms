import "server-only";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Admin check for route handlers.
 *
 * The redirecting requireAdmin() throws NEXT_REDIRECT, which these handlers'
 * try/catch turned into a 500 for every unauthenticated or non-admin caller.
 */
export async function adminGuard(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  if ((session.user as { role?: string | null }).role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, userId: session.user.id };
}
