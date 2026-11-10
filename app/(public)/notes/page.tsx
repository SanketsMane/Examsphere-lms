import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { withSocial } from "@/lib/seo-metadata";
import { FadeIn } from "@/components/ui/fade-in";
import { NoteCard } from "@/components/notes/NoteCard";
import { catalogFacets, coverUrl, listPublishedNotes } from "@/lib/notes/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = withSocial({
  alternates: { canonical: "/notes" },
  title: "Study Notes | ExamSphere",
  description: "Exam-focused study notes for JEE, NEET, Foundation (Class 6–10) and MBBS. Free and premium notes with a free preview.",
});

interface Props {
  searchParams: Promise<{ q?: string; program?: string; subject?: string; price?: string }>;
}

function chipHref(current: Record<string, string | undefined>, key: string, value?: string) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, [key]: value })) if (v) next.set(k, v);
  const qs = next.toString();
  return qs ? `/notes?${qs}` : "/notes";
}

export default async function NotesCatalogPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = {
    q: sp.q?.slice(0, 100) || undefined,
    program: sp.program || undefined,
    subject: sp.subject || undefined,
    price: sp.price === "free" || sp.price === "paid" ? sp.price : undefined,
  } as const;
  const [notes, facets] = await Promise.all([listPublishedNotes(filters), catalogFacets()]);
  const current = { q: filters.q, program: filters.program, subject: filters.subject, price: filters.price };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-all",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-white/5 dark:text-gray-300"
    );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <section className="relative overflow-hidden border-b border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-black lg:py-24">
        <div className="container relative z-10 mx-auto px-4 text-center">
          <FadeIn>
            <h1 className="mb-5 text-4xl font-extrabold tracking-tight text-[#011E21] dark:text-white lg:text-6xl">
              Study <span className="text-primary">Notes</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Clear, exam-focused notes for JEE, NEET, Foundation and MBBS. Preview pages free before you buy.
            </p>
            <form action="/notes" className="mx-auto flex max-w-xl items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-[var(--shadow-es-sm)]">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="Search by topic, chapter or subject"
                className="w-full bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search notes"
              />
              {filters.program && <input type="hidden" name="program" value={filters.program} />}
              {filters.price && <input type="hidden" name="price" value={filters.price} />}
            </form>
          </FadeIn>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold">Programme:</span>
            <Link href={chipHref(current, "program")} className={chip(!filters.program)}>All</Link>
            {facets.programs.map((p) => (
              <Link key={p} href={chipHref(current, "program", p)} className={chip(filters.program === p)}>{p}</Link>
            ))}
          </div>
          {facets.subjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-semibold">Subject:</span>
              <Link href={chipHref(current, "subject")} className={chip(!filters.subject)}>All</Link>
              {facets.subjects.map((s) => (
                <Link key={s} href={chipHref(current, "subject", s)} className={chip(filters.subject === s)}>{s}</Link>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold">Price:</span>
            <Link href={chipHref(current, "price")} className={chip(!filters.price)}>All</Link>
            <Link href={chipHref(current, "price", "free")} className={chip(filters.price === "free")}>Free</Link>
            <Link href={chipHref(current, "price", "paid")} className={chip(filters.price === "paid")}>Paid</Link>
          </div>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          {notes.length} {notes.length === 1 ? "set of notes" : "sets of notes"}
        </p>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center">
            <p className="font-display text-lg font-bold">No notes here yet</p>
            <p className="mt-1 text-sm text-muted-foreground">New notes are added regularly. Try another filter or check back soon.</p>
            {(filters.q || filters.program || filters.subject || filters.price) && (
              <Link href="/notes" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">Clear filters</Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {notes.map((n) => (
              <NoteCard key={n.id} note={n} coverSrc={coverUrl(n)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
