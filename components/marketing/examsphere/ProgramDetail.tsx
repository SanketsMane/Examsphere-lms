import Link from "next/link";
import { CheckCircle2, ChevronRight, Plus, UserCheck } from "lucide-react";
import type { CourseAccent } from "@/app/(public)/_data/courses-content";
import {
  PROGRAM_GROUPS,
  PROGRAMS,
  type ProgramData,
} from "@/app/(public)/_data/programs-content";
import { EnquireButton } from "./EnquireButton";

const accentMap: Record<
  CourseAccent,
  {
    tagBg: string;
    tagText: string;
    btn: string;
    btnSoft: string;
    iconText: string;
    heroBg: string;
  }
> = {
  navy: {
    tagBg: "bg-[#EAF0FC] dark:bg-navy-900/40",
    tagText: "text-navy-900 dark:text-blue-200",
    btn: "bg-navy-900 hover:bg-navy-950 text-white",
    btnSoft:
      "bg-card border border-border text-navy-900 dark:text-white hover:border-navy-900 dark:hover:border-white",
    iconText: "text-navy-700 dark:text-blue-300",
    heroBg: "bg-[#EAF0FC]/45 dark:bg-navy-900/20",
  },
  orange: {
    tagBg: "bg-[#FFF0E2] dark:bg-orange-500/15",
    tagText: "text-orange-600 dark:text-orange-300",
    btn: "bg-orange-500 hover:bg-orange-600 text-white",
    btnSoft:
      "bg-card border border-border text-orange-600 dark:text-orange-300 hover:border-orange-500",
    iconText: "text-orange-600 dark:text-orange-300",
    heroBg: "bg-[#FFF0E2]/50 dark:bg-orange-500/10",
  },
  green: {
    tagBg: "bg-[#E4F8EF] dark:bg-es-green-600/15",
    tagText: "text-es-green-700 dark:text-emerald-300",
    btn: "bg-es-green-600 hover:bg-es-green-700 text-white",
    btnSoft:
      "bg-card border border-border text-es-green-700 dark:text-emerald-300 hover:border-es-green-600",
    iconText: "text-es-green-600 dark:text-emerald-300",
    heroBg: "bg-[#E4F8EF]/55 dark:bg-es-green-600/10",
  },
};

export function ProgramDetail({ program }: { program: ProgramData }) {
  const a = accentMap[program.accent];
  const group = PROGRAM_GROUPS.find((g) => g.id === program.group);
  const related = PROGRAMS.filter((p) => p.slug !== program.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className={`border-b border-border ${a.heroBg}`}>
        <div className="max-w-[1240px] mx-auto px-6 pt-8 pb-14 md:pt-10 md:pb-16">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-muted-foreground flex-wrap">
              <li>
                <Link href="/" className="hover:text-navy-900 dark:hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <li>
                <Link
                  href="/programs"
                  className="hover:text-navy-900 dark:hover:text-white transition-colors"
                >
                  Programs
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <li className="font-semibold text-ink-900 dark:text-foreground">{program.navLabel}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10 items-start">
            <div>
              <span
                className={`inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 ${a.tagBg} ${a.tagText}`}
              >
                {program.tag}
              </span>
              <h1 className="font-display text-[34px] sm:text-4xl lg:text-[46px] font-extrabold leading-[1.1] tracking-tight text-navy-950 dark:text-white">
                {program.title}
              </h1>
              <p className={`mt-3 text-lg font-semibold ${a.tagText}`}>{program.tagline}</p>
              <p className="mt-4 text-ink-700 dark:text-muted-foreground text-base leading-relaxed max-w-2xl">
                {program.description}
              </p>

              <div className="flex flex-wrap gap-3.5 mt-8">
                <EnquireButton
                  withArrow
                  className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 cursor-pointer ${a.btn}`}
                />
                <Link
                  href="/programs"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 ${a.btnSoft}`}
                >
                  All Programs
                </Link>
              </div>
            </div>

            {/* Highlights */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5">
              {program.highlights.map((h) => {
                const Icon = h.icon;
                return (
                  <div
                    key={h.label}
                    className="bg-card border border-border rounded-2xl px-5 py-4 shadow-[var(--shadow-es-sm)] flex items-center gap-3.5"
                  >
                    <span
                      className={`w-10 h-10 shrink-0 rounded-full bg-bg-soft dark:bg-muted flex items-center justify-center ${a.iconText}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-muted-foreground">
                        {h.label}
                      </div>
                      <div className="font-bold text-ink-900 dark:text-foreground truncate">
                        {h.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Features + sidebar ───────────────────── */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 items-start">
          <div className="space-y-8">
            {/* Key features */}
            <div className="bg-card border border-border rounded-3xl p-7 md:p-8 shadow-[var(--shadow-es-sm)]">
              <h2 className="font-display text-xl font-extrabold text-navy-950 dark:text-white mb-5">
                What&apos;s Included
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {program.keyFeatures.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-2.5 text-sm font-semibold text-ink-900 dark:text-foreground bg-bg-soft dark:bg-muted/40 px-3.5 py-3 rounded-xl"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${a.iconText}`} />
                      <span>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outcomes */}
            <div className="bg-card border border-border rounded-3xl p-7 md:p-8 shadow-[var(--shadow-es-sm)]">
              <h2 className="font-display text-xl font-extrabold text-navy-950 dark:text-white mb-5">
                Learning Outcomes
              </h2>
              <ul className="space-y-3">
                {program.outcomes.map((o) => (
                  <li
                    key={o}
                    className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-muted-foreground"
                  >
                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${a.iconText}`} />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-muted-foreground mb-3.5">
                Program Details
              </h2>
              {(
                [
                  ["Duration", program.details.duration],
                  ["Mode", program.details.mode],
                  ["Level", program.details.level],
                  ["Language", program.details.language],
                ] as const
              ).map(([k, v], i, arr) => (
                <div
                  key={k}
                  className={`flex justify-between items-center gap-4 py-2.5 text-sm ${
                    i < arr.length - 1 ? "border-b border-dashed border-border" : ""
                  }`}
                >
                  <span className="text-ink-500 dark:text-muted-foreground font-semibold">{k}</span>
                  <span className="text-ink-900 dark:text-foreground font-bold text-right">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-[52px] h-[52px] shrink-0 rounded-full bg-navy-900 text-white flex items-center justify-center font-display font-bold">
                  {program.mentor.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground">{program.mentor.name}</div>
                  <div className="text-xs text-ink-500 dark:text-muted-foreground">
                    {program.mentor.role}
                  </div>
                </div>
              </div>
              <p className="text-sm text-ink-600 dark:text-muted-foreground my-4 leading-relaxed">
                Personalised fees &amp; batches — share your details and our team will get in touch.
              </p>
              <EnquireButton
                className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 cursor-pointer ${a.btn}`}
              />
              <p className="text-xs text-center text-ink-500 dark:text-muted-foreground mt-2.5">
                No payment now — just an enquiry.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ───────────────────────── Curriculum ───────────────────────── */}
      <section className="border-t border-border bg-bg-soft dark:bg-muted/30 py-14 md:py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            Syllabus &amp; Structure
          </h2>
          <p className="text-ink-700 dark:text-muted-foreground mt-2.5 max-w-2xl">
            What the programme actually covers, module by module.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {program.curriculum.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`w-10 h-10 shrink-0 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center ${a.iconText}`}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                      {mod.title}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {mod.items.map((it) => (
                      <li
                        key={it}
                        className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-muted-foreground"
                      >
                        <span
                          className={`mt-[7px] h-1.5 w-1.5 rounded-full shrink-0 ${a.iconText} bg-current`}
                          aria-hidden
                        />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────── Who it's for + FAQ ───────────────────── */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
              Who This Is For
            </h2>
            <ul className="mt-6 space-y-3.5">
              {program.whoItsFor.map((w) => (
                <li
                  key={w}
                  className="flex items-start gap-3 bg-card border border-border rounded-2xl px-5 py-4 shadow-[var(--shadow-es-sm)]"
                >
                  <UserCheck className={`h-[18px] w-[18px] mt-0.5 shrink-0 ${a.iconText}`} />
                  <span className="text-sm text-ink-700 dark:text-muted-foreground">{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 space-y-3">
              {program.faqs.map((f) => (
                <details
                  key={f.q}
                  className="group bg-card border border-border rounded-2xl px-5 py-4 shadow-[var(--shadow-es-sm)]"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-semibold text-sm text-ink-900 dark:text-foreground marker:content-none">
                    {f.q}
                    <Plus
                      className={`h-4 w-4 shrink-0 transition-transform group-open:rotate-45 ${a.iconText}`}
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 text-sm text-ink-700 dark:text-muted-foreground leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Related ───────────────────────── */}
      <section className="border-t border-border bg-bg-soft dark:bg-muted/30 py-14 md:py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            Other Programs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">
            {related.map((p) => {
              const ra = accentMap[p.accent];
              const Icon = p.icon;
              return (
                <Link
                  key={p.slug}
                  href={`/programs/${p.slug}`}
                  className="group bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-es-lg)]"
                >
                  <span
                    className={`w-11 h-11 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center mb-4 ${ra.iconText}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div
                    className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 ${ra.tagText}`}
                  >
                    {p.tag}
                  </div>
                  <h3 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                    {p.navLabel}
                  </h3>
                  <p className="text-sm text-ink-700 dark:text-muted-foreground mt-2 line-clamp-2">
                    {p.tagline}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold mt-4 ${ra.tagText}`}
                  >
                    View program
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Final CTA ───────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-[1240px] mx-auto px-6 py-14 md:py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            Ready to start {program.navLabel}?
          </h2>
          <p className="text-ink-700 dark:text-muted-foreground mt-3 max-w-xl mx-auto">
            Share your details and our team will get in touch with batch timings, fees and the
            right plan for your target year.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            <EnquireButton
              withArrow
              className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 cursor-pointer ${a.btn}`}
            />
            <Link
              href="/contact"
              className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 ${a.btnSoft}`}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
