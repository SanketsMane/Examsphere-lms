import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { getClientIP, protectGeneral } from "@/lib/security";
import { logger } from "@/lib/logger";
import { NotePurchaseError } from "@/lib/notes/purchase";
import { requestNoteRefund } from "@/lib/notes/refunds";

export const dynamic = "force-dynamic";

/** Student asks for a refund under the notes refund policy. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSessionWithRole();
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in" }, { status: 401 });

  const limit = await protectGeneral(req, `${session.user.id || getClientIP(req)}:notes-refund`, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason : "";
  try {
    const result = await requestNoteRefund(session.user.id, id, reason);
    return NextResponse.json({
      ok: true,
      status: result.status,
      message: result.status === "APPROVED" ? "Refund approved. The money is on its way back." : "Refund requested. We'll review it shortly.",
    });
  } catch (err) {
    if (err instanceof NotePurchaseError) return NextResponse.json({ error: err.message }, { status: 400 });
    logger.error("NOTE_REFUND_REQUEST_ERROR", err as Error, session.user.id);
    return NextResponse.json({ error: "Could not submit the request. Please try again." }, { status: 500 });
  }
}
