import Link from "next/link";
import { BookOpenText, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { effectiveNotePricePaise, formatRupeesFromPaise } from "@/lib/notes/validation";

export interface NoteCardProps {
  note: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string | null;
    program: string | null;
    subject: string | null;
    chapter: string | null;
    language: string;
    accessType: "FREE" | "PAID" | "COURSE_ONLY";
    pricePaise: number;
    discountPricePaise: number | null;
    isFeatured?: boolean;
    currentVersion: { pageCount: number } | null;
  };
  coverSrc: string | null;
  href?: string;
  /** Replaces the price line, e.g. "Continue at page 12". */
  footer?: React.ReactNode;
}

export function NotePrice({ note }: { note: NoteCardProps["note"] }) {
  if (note.accessType === "FREE") return <span className="font-bold text-es-green-700 dark:text-emerald-400">Free</span>;
  if (note.accessType === "COURSE_ONLY") return <span className="font-semibold text-muted-foreground">Included with course</span>;
  const price = effectiveNotePricePaise(note);
  const discounted = price < note.pricePaise;
  return (
    <span className="flex items-baseline gap-2">
      <span className="font-bold text-navy-950 dark:text-white">{formatRupeesFromPaise(price)}</span>
      {discounted && <span className="text-xs text-muted-foreground line-through">{formatRupeesFromPaise(note.pricePaise)}</span>}
    </span>
  );
}

export function NoteCard({ note, coverSrc, href, footer }: NoteCardProps) {
  const pages = note.currentVersion?.pageCount;
  return (
    <Link
      href={href ?? `/notes/${note.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-es-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-es-md)]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-navy-900/10 via-orange-500/5 to-es-green-600/10">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own route, already resized
          <img src={coverSrc} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center">
            <BookOpenText className="size-10 text-navy-900/40 dark:text-white/40" />
            <span className="line-clamp-3 font-display text-lg font-bold text-navy-950/70 dark:text-white/70">{note.title}</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {note.program && <Badge className="bg-navy-950/85 text-white hover:bg-navy-950/85">{note.program}</Badge>}
          {note.isFeatured && <Badge className="bg-orange-500 text-white hover:bg-orange-500">Featured</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {[note.subject, note.chapter].filter(Boolean).join(" · ") || note.language}
        </p>
        <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-navy-950 group-hover:text-primary dark:text-white">
          {note.title}
        </h3>
        {note.shortDescription && <p className="line-clamp-2 text-sm text-muted-foreground">{note.shortDescription}</p>}
        <div className={cn("mt-auto flex items-center justify-between gap-2 pt-2 text-sm")}>
          {footer ?? <NotePrice note={note} />}
          {pages ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> {pages} pages
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
