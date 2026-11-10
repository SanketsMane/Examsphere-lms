import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Download, Eye, FileText, Languages } from "lucide-react";
import { getSessionWithRole } from "@/app/data/auth/require-roles";
import { withSocial } from "@/lib/seo-metadata";
import { Badge } from "@/components/ui/badge";
import { NotePrice } from "@/components/notes/NoteCard";
import { NoteBuyPanel, type NoteBuyState } from "@/components/notes/NoteBuyPanel";
import { PdfViewerClient } from "@/components/notes/PdfViewerClient";
import { getNoteAccess } from "@/lib/notes/access";
import { coverUrl, getNoteBySlug } from "@/lib/notes/queries";
import { effectiveNotePricePaise } from "@/lib/notes/validation";
import { describeRefundPolicy, getNotesSettings } from "@/lib/notes/settings";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note || note.status !== "PUBLISHED") return { title: "Notes not found | ExamSphere", robots: { index: false } };
  return withSocial({
    title: `${note.title} | ExamSphere Notes`,
    description: note.shortDescription || `${note.title}: exam-focused study notes from ExamSphere.`,
    alternates: { canonical: `/notes/${note.slug}` },
  });
}

export default async function NoteDetailPage({ params }: Props) {
  const { slug } = await params;
  const [note, session] = await Promise.all([getNoteBySlug(slug), getSessionWithRole()]);
  const user = session?.user ?? null;
  if (!note || (note.status !== "PUBLISHED" && user?.role !== "admin")) notFound();

  const [access, settings] = await Promise.all([getNoteAccess(user, note), getNotesSettings()]);
  const refundPolicy = describeRefundPolicy(settings);
  let state: NoteBuyState;
  if (access.allowed) state = access.via === "FREE" ? "free" : "owned";
  else if (access.reason === "REVOKED") state = "revoked";
  else if (access.reason === "COURSE_ONLY") state = "course_only";
  else if (access.reason === "NEEDS_PURCHASE") state = "buy";
  else state = note.accessType === "FREE" ? "free" : note.accessType === "COURSE_ONLY" ? "course_only" : "buy";

  const includedCourses = note.courses.filter((c) => c.includedWithCourse).map((c) => c.course);
  const pages = note.currentVersion?.pageCount ?? 0;
  const priceForSchema = note.accessType === "FREE" ? 0 : effectiveNotePricePaise(note) / 100;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: note.title,
    description: note.shortDescription || undefined,
    category: [note.program, note.subject].filter(Boolean).join(" / ") || "Study notes",
    brand: { "@type": "Brand", name: "ExamSphere" },
    ...(note.accessType !== "COURSE_ONLY"
      ? { offers: { "@type": "Offer", priceCurrency: "INR", price: priceForSchema, availability: "https://schema.org/InStock", url: `https://examsphere.online/notes/${note.slug}` } }
      : {}),
  };
  const cover = coverUrl(note);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <Link href="/notes" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> All notes
        </Link>

        {note.status !== "PUBLISHED" && (
          <p className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm">
            Admin preview: this note is <strong>{note.status.toLowerCase()}</strong> and not visible to students.
          </p>
        )}

        {/* Phones: header, then the buy box, then details and preview (DOM order).
            Desktop: the buy box is a sticky right column spanning both rows. */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-x-10">
            <header className="flex min-w-0 flex-col gap-6 sm:flex-row lg:col-start-1 lg:row-start-1">
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element -- served by our own route, already resized
                <img src={cover} alt="" className="aspect-[3/4] w-40 shrink-0 rounded-xl border border-border object-cover shadow-[var(--shadow-es-sm)]" />
              )}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {note.program && <Badge>{note.program}</Badge>}
                  {note.subject && <Badge variant="secondary">{note.subject}</Badge>}
                  {note.chapter && <Badge variant="outline">{note.chapter}</Badge>}
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-950 dark:text-white lg:text-4xl">{note.title}</h1>
                {note.shortDescription && <p className="text-lg text-muted-foreground">{note.shortDescription}</p>}
              </div>
            </header>

          <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-es-md)]">
              <div className="text-2xl">
                <NotePrice note={note} />
              </div>
              <NoteBuyPanel
                note={{
                  id: note.id,
                  slug: note.slug,
                  title: note.title,
                  pricePaise: note.pricePaise,
                  effectivePricePaise: effectiveNotePricePaise(note),
                }}
                state={state}
                signedIn={!!user}
                courses={includedCourses}
              />
              <ul className="space-y-2.5 border-t border-border pt-5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><FileText className="size-4" /> {pages} pages</li>
                <li className="flex items-center gap-2"><Languages className="size-4" /> {note.language}</li>
                <li className="flex items-center gap-2">
                  <Download className="size-4" />
                  {note.allowDownload ? `Read online + download (up to ${note.maxDownloads} times)` : "Read online in the app"}
                </li>
                {note.currentVersion && (
                  <li className="flex items-center gap-2">
                    <CalendarDays className="size-4" /> Updated {note.currentVersion.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </li>
                )}
              </ul>
              {note.accessType === "PAID" && (
                <p className="border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="font-semibold">Refunds:</span> {refundPolicy}
                </p>
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
            {note.description && (
              <section className="space-y-2">
                <h2 className="font-display text-xl font-bold">What&apos;s inside</h2>
                <div className="whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{note.description}</div>
              </section>
            )}

            {note.currentVersion?.previewKey && note.previewPages > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                  <Eye className="size-5" /> Free preview
                  <span className="text-sm font-normal text-muted-foreground">
                    first {Math.min(note.previewPages, pages)} of {pages} pages
                  </span>
                </h2>
                <div className="rounded-2xl border border-border bg-muted/30 p-3 sm:p-4">
                  <PdfViewerClient url={`/api/notes/${note.id}/preview`} />
                </div>
              </section>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
