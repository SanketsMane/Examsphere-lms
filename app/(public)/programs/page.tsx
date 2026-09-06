import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CourseAccent } from "@/app/(public)/_data/courses-content";
import { PROGRAM_GROUPS, programsByGroup } from "@/app/(public)/_data/programs-content";
import { EnquireButton } from "@/components/marketing/examsphere/EnquireButton";

export const metadata: Metadata = {
  title: "Programs | ExamSphere",
  description:
    "Explore ExamSphere programmes — JEE (Main & Advanced), NEET (UG), Class 9–10 and Class 11–12 Foundation, and MBBS medical subjects.",
  alternates: { canonical: "/programs" },
};

const accent: Record<CourseAccent, { tagText: string; iconText: string; btn: string; chip: string }> = {
  navy: {
    tagText: "text-navy-900 dark:text-blue-200",
    iconText: "text-navy-700 dark:text-blue-300",
    btn: "bg-navy-900 hover:bg-navy-950 text-white",
    chip: "bg-[#EAF0FC] dark:bg-navy-900/40 text-navy-900 dark:text-blue-200",
  },
  orange: {
    tagText: "text-orange-600 dark:text-orange-300",
    iconText: "text-orange-600 dark:text-orange-300",
    btn: "bg-orange-500 hover:bg-orange-600 text-white",
    chip: "bg-[#FFF0E2] dark:bg-orange-500/15 text-orange-600 dark:text-orange-300",
  },
  green: {
    tagText: "text-es-green-700 dark:text-emerald-300",
    iconText: "text-es-green-600 dark:text-emerald-300",
    btn: "bg-es-green-600 hover:bg-es-green-700 text-white",
    chip: "bg-[#E4F8EF] dark:bg-es-green-600/15 text-es-green-700 dark:text-emerald-300",
  },
};

export default function ProgramsIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border bg-bg-soft dark:bg-muted/30">
        <div className="max-w-[1240px] mx-auto px-6 py-14 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-ink-500 dark:text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-navy-900 dark:hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <li className="font-semibold text-ink-900 dark:text-foreground">Programs</li>
            </ol>
          </nav>

          <h1 className="font-display text-[34px] sm:text-4xl lg:text-[46px] font-extrabold leading-[1.1] tracking-tight text-navy-950 dark:text-white max-w-3xl">
            Find the right program for your goal.
          </h1>
          <p className="mt-4 text-lg text-ink-700 dark:text-muted-foreground max-w-2xl">
            Every programme has its own syllabus, mentors and test plan. Pick the one that matches
            where you are right now.
          </p>
        </div>
      </section>

      {/* Groups */}
      {PROGRAM_GROUPS.map((group, gi) => {
        const a = accent[group.accent];
        const items = programsByGroup(group.id);

        return (
          <section
            key={group.id}
            id={group.id}
            className={`es-anchor border-b border-border py-14 md:py-16 ${
              gi % 2 === 1 ? "bg-bg-soft dark:bg-muted/30" : "bg-background"
            }`}
          >
            <div className="max-w-[1240px] mx-auto px-6">
              <span
                className={`inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3.5 ${a.chip}`}
              >
                {group.label}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
                {group.label}
              </h2>
              <p className="text-ink-700 dark:text-muted-foreground mt-2.5 max-w-2xl">
                {group.blurb}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
                {items.map((p) => {
                  const Icon = p.icon;
                  return (
                    <Link
                      key={p.slug}
                      href={`/programs/${p.slug}`}
                      className="group flex flex-col bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-es-lg)]"
                    >
                      <span
                        className={`w-11 h-11 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center mb-4 ${a.iconText}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                        {p.navLabel}
                      </h3>
                      <p className={`text-sm font-semibold mt-1 ${a.tagText}`}>{p.tagline}</p>
                      <p className="text-sm text-ink-700 dark:text-muted-foreground mt-3 flex-1">
                        {p.description.slice(0, 130).trimEnd()}…
                      </p>

                      <dl className="mt-5 pt-4 border-t border-dashed border-border space-y-1.5 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-500 dark:text-muted-foreground font-semibold">
                            Duration
                          </dt>
                          <dd className="font-bold text-ink-900 dark:text-foreground text-right">
                            {p.details.duration}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-500 dark:text-muted-foreground font-semibold">
                            Level
                          </dt>
                          <dd className="font-bold text-ink-900 dark:text-foreground text-right">
                            {p.details.level}
                          </dd>
                        </div>
                      </dl>

                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold mt-5 ${a.tagText}`}
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
        );
      })}

      {/* CTA */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 md:py-16 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
          Not sure which program fits?
        </h2>
        <p className="text-ink-700 dark:text-muted-foreground mt-3 max-w-xl mx-auto">
          Tell us your class and target exam. Our team will recommend the right track and share
          batch timings and fees.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          <EnquireButton
            withArrow
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm bg-navy-900 hover:bg-navy-950 text-white transition-all hover:-translate-y-0.5 cursor-pointer"
          />
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm bg-card border border-border text-navy-900 dark:text-white hover:border-navy-900 dark:hover:border-white transition-all hover:-translate-y-0.5"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
