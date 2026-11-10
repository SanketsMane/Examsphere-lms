import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, IndianRupee, ShoppingBag, Users } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, Panel, StatCard } from "@/components/dashboard/es/dashboard-kit";
import { EXPERTISE_AREAS, PROGRAM_CATEGORY_NAMES } from "@/lib/examsphere-taxonomy";
import { coverUrl } from "@/lib/notes/queries";
import { formatRupeesFromPaise, MAX_NOTE_PDF_BYTES } from "@/lib/notes/validation";
import { NoteForm } from "../_components/NoteForm";
import { NoteFiles } from "../_components/NoteFiles";
import { CourseLinks } from "../_components/CourseLinks";
import { NoteStatusBar } from "../_components/NoteStatusBar";
import { NoteAccessManager, type AccessRow } from "../_components/NoteAccessManager";

export const dynamic = "force-dynamic";

export default async function AdminNotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const note = await prisma.note.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { version: "desc" } },
      courses: { orderBy: { sortOrder: "asc" } },
      entitlements: {
        where: { status: { not: "PENDING" } },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });
  if (!note) notFound();

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [courses, views30, downloads30, previews30] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true, status: true }, orderBy: { title: "asc" } }),
    prisma.noteEvent.count({ where: { noteId: id, type: "VIEW", createdAt: { gte: since } } }),
    prisma.noteEvent.count({ where: { noteId: id, type: "DOWNLOAD", createdAt: { gte: since } } }),
    prisma.noteEvent.count({ where: { noteId: id, type: "PREVIEW", createdAt: { gte: since } } }),
  ]);

  const paid = note.entitlements.filter((e) => e.status === "ACTIVE" && (e.source === "PURCHASE" || e.source === "WALLET"));
  const revenue = paid.reduce((s, e) => s + e.amountPaise, 0);
  const activeReaders = note.entitlements.filter((e) => e.status === "ACTIVE").length;
  const sold = note.entitlements.some((e) => e.source === "PURCHASE" || e.source === "WALLET");
  const pageCount = note.versions.find((v) => v.id === note.currentVersionId)?.pageCount ?? 0;

  const rows: AccessRow[] = note.entitlements.map((e) => ({
    id: e.id,
    name: e.user.name,
    email: e.user.email,
    source: e.source,
    status: e.status,
    amountPaise: e.amountPaise,
    date: (e.activatedAt ?? e.createdAt).toISOString(),
    lastReadPage: e.lastReadPage,
    downloadCount: e.downloadCount,
    paymentId: e.razorpayPaymentId,
  }));

  return (
    <div className="space-y-6">
      <Link href="/admin/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Notes
      </Link>
      <PageHeader
        title={note.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{note.status.toLowerCase()}</Badge>
            <span>/notes/{note.slug}</span>
          </span>
        }
      >
        <NoteStatusBar noteId={note.id} slug={note.slug} status={note.status} hasFile={!!note.currentVersionId} sold={sold} />
      </PageHeader>

      {!note.currentVersionId && (
        <p className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm">
          Step 2: upload the notes PDF in the <strong>File</strong> tab, then publish.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Paid sales" value={paid.length} accent="orange" />
        <StatCard icon={IndianRupee} label="Revenue" value={formatRupeesFromPaise(revenue)} accent="green" />
        <StatCard icon={Users} label="Readers with access" value={activeReaders} accent="violet" />
        <StatCard icon={Eye} label="Opens · 30 days" value={views30} hint={`${previews30} previews · ${downloads30} downloads`} accent="sky" />
      </div>

      <Tabs defaultValue={note.currentVersionId ? "details" : "file"}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
          <TabsTrigger value="courses">Courses ({note.courses.length})</TabsTrigger>
          <TabsTrigger value="access">Access ({rows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Panel>
            <NoteForm
              mode="edit"
              noteId={note.id}
              programs={PROGRAM_CATEGORY_NAMES}
              subjects={EXPERTISE_AREAS}
              defaults={{
                title: note.title,
                slug: note.slug,
                shortDescription: note.shortDescription ?? "",
                description: note.description ?? "",
                program: note.program ?? "",
                subject: note.subject ?? "",
                chapter: note.chapter ?? "",
                language: (["English", "Hindi", "Hinglish"].includes(note.language) ? note.language : "English") as "English",
                accessType: note.accessType,
                priceRupees: note.pricePaise / 100,
                discountPriceRupees: note.discountPricePaise ? note.discountPricePaise / 100 : undefined,
                previewPages: note.previewPages,
                allowDownload: note.allowDownload,
                maxDownloads: note.maxDownloads,
                isFeatured: note.isFeatured,
              }}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="file" className="mt-4">
          <Panel>
            <NoteFiles
              noteId={note.id}
              coverSrc={coverUrl(note)}
              maxPdfMb={Math.floor(MAX_NOTE_PDF_BYTES / 1024 / 1024)}
              versions={note.versions.map((v) => ({
                id: v.id,
                version: v.version,
                pageCount: v.pageCount,
                fileSize: v.fileSize,
                changelog: v.changelog,
                createdAt: v.createdAt.toISOString(),
                isCurrent: v.id === note.currentVersionId,
              }))}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <Panel>
            <CourseLinks
              noteId={note.id}
              courses={courses}
              initial={note.courses.map((c) => ({ courseId: c.courseId, includedWithCourse: c.includedWithCourse }))}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          <Panel>
            <NoteAccessManager noteId={note.id} rows={rows} pageCount={pageCount} />
          </Panel>
        </TabsContent>
      </Tabs>

      {note.allowDownload && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Download className="size-3.5" /> Downloads allowed: {note.maxDownloads} per student, watermarked.
        </p>
      )}
    </div>
  );
}
