import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Target,
  Users,
  BarChart3,
  MessageCircle,
  ClipboardList,
  PlayCircle,
  Compass,
  HeartHandshake,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";
import { PROGRAM_GROUPS, programsByGroup } from "@/app/(public)/_data/programs-content";
import { EnquireButton } from "@/components/marketing/examsphere/EnquireButton";

export const metadata: Metadata = {
  title: "About Us | ExamSphere",
  description:
    "ExamSphere is a focused coaching platform for JEE, NEET, Foundation and MBBS students — live classes, structured practice, mentorship and honest performance feedback.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: Compass,
    title: "Concepts before shortcuts",
    body: "Tricks collapse under exam pressure. We teach the underlying idea first, then the speed, so students can handle a question they have never seen before.",
  },
  {
    icon: BarChart3,
    title: "Honest feedback",
    body: "Every test is followed by real analysis — which chapters are weak, where marks are leaking, what to fix next. No inflated scores, no vague encouragement.",
  },
  {
    icon: HeartHandshake,
    title: "Mentorship, not just lectures",
    body: "Students are assigned mentors who track their progress, answer doubts and step in when preparation drifts. Nobody quietly falls behind.",
  },
  {
    icon: ShieldCheck,
    title: "Respect for the student",
    body: "Small batches, reasonable schedules and no pressure tactics. Preparation should be demanding, not damaging.",
  },
];

const capabilities = [
  { icon: PlayCircle, label: "Live & recorded classes" },
  { icon: ClipboardList, label: "Mock tests & previous-year papers" },
  { icon: BarChart3, label: "Performance analytics" },
  { icon: MessageCircle, label: "Doubt support" },
  { icon: Users, label: "Small batch mentorship" },
  { icon: Lightbulb, label: "Structured daily practice" },
];

export default function AboutPage() {
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
              <li className="font-semibold text-ink-900 dark:text-foreground">About Us</li>
            </ol>
          </nav>

          <span className="inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 bg-[#EAF0FC] dark:bg-navy-900/40 text-navy-900 dark:text-blue-200">
            About ExamSphere
          </span>
          <h1 className="font-display text-[34px] sm:text-4xl lg:text-[46px] font-extrabold leading-[1.1] tracking-tight text-navy-950 dark:text-white max-w-3xl">
            We prepare students for the exams that decide their careers.
          </h1>
          <p className="mt-5 text-lg text-ink-700 dark:text-muted-foreground max-w-3xl leading-relaxed">
            ExamSphere is a focused coaching platform for JEE, NEET, school Foundation and MBBS
            students. We are not a general-purpose course marketplace — every programme we run
            exists to move a student closer to a specific exam, with a syllabus, a test plan and a
            mentor attached to it.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-10 items-start">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
              Why we exist
            </h2>
            <div className="mt-5 space-y-4 text-ink-700 dark:text-muted-foreground leading-relaxed">
              <p>
                Serious exam preparation has traditionally meant relocating to a coaching hub,
                sitting in a hall of several hundred students, and hoping you are not the one who
                gets lost. Students who could not move, or could not afford it, were left with
                scattered videos and no structure.
              </p>
              <p>
                We built ExamSphere to remove that trade-off. Live teaching, daily practice,
                full-length testing and a mentor who actually knows your name — delivered wherever
                the student is, in English or Hindi, at a batch size where questions still get
                answered.
              </p>
              <p>
                The goal is not to be the biggest platform. It is to run a small number of
                programmes properly, and to be honest with students about where they stand.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-7 md:p-8 shadow-[var(--shadow-es-sm)]">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-11 h-11 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center text-navy-700 dark:text-blue-300">
                <Target className="h-5 w-5" />
              </span>
              <h2 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                What every programme includes
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {capabilities.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="flex items-center gap-2.5 text-sm font-semibold text-ink-900 dark:text-foreground bg-bg-soft dark:bg-muted/40 px-3.5 py-3 rounded-xl"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-navy-700 dark:text-blue-300" />
                    <span>{c.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-bg-soft dark:bg-muted/30 py-14 md:py-16">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            How we teach
          </h2>
          <p className="text-ink-700 dark:text-muted-foreground mt-2.5 max-w-2xl">
            Four principles that shape every class, test and mentor conversation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]"
                >
                  <span className="w-11 h-11 rounded-xl bg-bg-soft dark:bg-muted flex items-center justify-center mb-4 text-orange-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-navy-950 dark:text-white">
                    {v.title}
                  </h3>
                  <p className="text-sm text-ink-700 dark:text-muted-foreground mt-2 leading-relaxed">
                    {v.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="max-w-[1240px] mx-auto px-6 py-14 md:py-16">
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
          What we teach
        </h2>
        <p className="text-ink-700 dark:text-muted-foreground mt-2.5 max-w-2xl">
          Three tracks, each with its own programmes and mentors.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          {PROGRAM_GROUPS.map((group) => {
            const items = programsByGroup(group.id);
            const tone =
              group.accent === "navy"
                ? "text-navy-900 dark:text-blue-200"
                : group.accent === "orange"
                  ? "text-orange-600 dark:text-orange-300"
                  : "text-es-green-700 dark:text-emerald-300";

            return (
              <div
                key={group.id}
                className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)] flex flex-col"
              >
                <h3 className={`font-display font-extrabold text-lg ${tone}`}>{group.label}</h3>
                <p className="text-sm text-ink-700 dark:text-muted-foreground mt-2 flex-1">
                  {group.blurb}
                </p>
                <ul className="mt-5 pt-4 border-t border-dashed border-border space-y-1.5">
                  {items.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/programs/${p.slug}`}
                        className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-700 dark:text-foreground hover:text-navy-900 dark:hover:text-white py-1 transition-colors"
                      >
                        {p.navLabel}
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-[1240px] mx-auto px-6 py-14 md:py-16 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-navy-950 dark:text-white tracking-tight">
            Want to know if we&apos;re the right fit?
          </h2>
          <p className="text-ink-700 dark:text-muted-foreground mt-3 max-w-xl mx-auto">
            Tell us your class and target exam. We&apos;ll be straight with you about what the
            programme can and cannot do for you.
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
        </div>
      </section>
    </div>
  );
}
