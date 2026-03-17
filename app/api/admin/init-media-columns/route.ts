import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// One-time migration: expand logo/favicon columns to MEDIUMTEXT so base64 data URIs fit
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE site_settings MODIFY COLUMN logo MEDIUMTEXT, MODIFY COLUMN favicon MEDIUMTEXT"
    );
    return NextResponse.json({ success: true });
  } catch {
    // Already MEDIUMTEXT or table doesn't exist yet — not an error
    return NextResponse.json({ success: true });
  }
}
