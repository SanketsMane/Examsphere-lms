import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/app/data/user/require-user";
import { getNoteAccess, ensureReaderEntitlement } from "@/lib/notes/access";
import { getNoteBySlug } from "@/lib/notes/queries";
import { NoteReader } from "./NoteReader";
import { prisma } from "@/lib/db";
import { describeRefundPolicy, getNotesSettings, refundEligibility } from "@/lib/notes/settings";

export const dynamic = "force-dynamic";

export default async function ReadNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser();
  const note = await getNoteBySlug(slug);
  if (!note) notFound();

  const access = await getNoteAccess(user, note);
  // Not entitled (or not published): send them to the public page, which shows how to get it.
  if (!access.allowed) redirect(`/notes/${note.slug}`);
  if (!note.currentVersion) notFound();

  const entitlement = await ensureReaderEntitlement(user!.id, note.id, access);
  const isAdmin = access.via === "ADMIN";

  // Refund option for paid purchases, under the notes refund policy.
  let refund: { eligible: boolean; message: string; deadline: string | null } | null = null;
  if (entitlement && (entitlement.source === "PURCHASE" || entitlement.source === "WALLET")) {
    const [settings, request] = await Promise.all([
      getNotesSettings(),
      prisma.noteRefundRequest.findUnique({ where: { entitlementId: entitlement.id }, select: { status: true } }),
    ]);
    const check = refundEligibility({ ...entitlement, refundRequest: request }, note.currentVersion.pageCount, settings);
    refund = check.eligible
      ? { eligible: true, message: describeRefundPolicy(settings), deadline: check.deadline.toISOString() }
      : request
        ? { eligible: false, message: check.reason, deadline: null }
        : null; // not eligible and never asked: don't clutter the reader
  }
  const downloadsLeft = isAdmin ? null : Math.max(0, note.maxDownloads - (entitlement?.downloadCount ?? 0));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/dashboard/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="size-4" /> My Notes
          </Link>
          <h1 className="truncate font-display text-xl font-extrabold text-navy-950 dark:text-white sm:text-2xl">{note.title}</h1>
        </div>
      </div>
      <NoteReader
        noteId={note.id}
        initialPage={entitlement?.lastReadPage ?? 1}
        canDownload={isAdmin || (note.allowDownload && (downloadsLeft ?? 0) > 0)}
        downloadsLeft={downloadsLeft}
        allowDownload={note.allowDownload || isAdmin}
        trackProgress={!isAdmin}
        overlayText={user!.email}
        refund={refund}
      />
    </div>
  );
}
