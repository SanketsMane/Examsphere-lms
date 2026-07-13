import { CheckCircle2 } from "lucide-react";
import {
  COURSE_SECTIONS,
  type CourseSectionData,
  type CourseAccent,
} from "@/app/(public)/_data/courses-content";
import { EnquireButton } from "./EnquireButton";

const accentMap: Record<
  CourseAccent,
  {
    tagBg: string;
    tagText: string;
    btn: string;
    iconText: string;
    outcomeIcon: string;
    sectionBg: string;
  }
> = {
  navy: {
    tagBg: "bg-[#EAF0FC] dark:bg-navy-900/40",
    tagText: "text-navy-900 dark:text-blue-200",
    btn: "bg-navy-900 hover:bg-navy-950 text-white",
    iconText: "text-navy-700 dark:text-blue-300",
    outcomeIcon: "text-navy-700 dark:text-blue-300",
    sectionBg: "bg-background",
  },
  orange: {
    tagBg: "bg-[#FFF0E2] dark:bg-orange-500/15",
    tagText: "text-orange-600 dark:text-orange-300",
    btn: "bg-orange-500 hover:bg-orange-600 text-white",
    iconText: "text-orange-600 dark:text-orange-300",
    outcomeIcon: "text-orange-600 dark:text-orange-300",
    sectionBg: "bg-bg-soft dark:bg-muted/30",
  },
  green: {
    tagBg: "bg-[#E4F8EF] dark:bg-es-green-600/15",
    tagText: "text-es-green-700 dark:text-emerald-300",
    btn: "bg-es-green-600 hover:bg-es-green-700 text-white",
    iconText: "text-es-green-600 dark:text-emerald-300",
    outcomeIcon: "text-es-green-600 dark:text-emerald-300",
    sectionBg: "bg-background",
  },
};

export function CourseSection({ course }: { course: CourseSectionData }) {
  const a = accentMap[course.accent];

  return (
    <section
      id={course.id}
      className={`es-anchor border-t border-border py-16 md:py-20 ${a.sectionBg}`}
    >
      <div className="max-w-[1240px] mx-auto px-6">
        {/* Head */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span
              className={`inline-block text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-3.5 ${a.tagBg} ${a.tagText}`}
            >
              {course.tag}
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-navy-950 dark:text-white tracking-tight">
              {course.title}
            </h2>
            <p className="text-ink-700 dark:text-muted-foreground text-base mt-3">
              {course.description}
            </p>
          </div>
          <EnquireButton
            withArrow
            className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 shrink-0 cursor-pointer ${a.btn}`}
          />
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
          {/* Left panel: features + outcomes */}
          <div className="bg-card border border-border rounded-3xl p-7 md:p-8 shadow-[var(--shadow-es-sm)]">
            <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-muted-foreground mb-4">
              Key Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {course.keyFeatures.map((f) => {
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

            <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-muted-foreground mt-7 mb-4">
              Learning Outcomes
            </h3>
            <ul className="space-y-2.5">
              {course.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2.5 text-sm text-ink-700 dark:text-muted-foreground">
                  <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${a.outcomeIcon}`} />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right stack: details + mentor/price */}
          <div className="flex flex-col gap-5">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-[var(--shadow-es-sm)]">
              <h3 className="text-sm font-bold uppercase tracking-wide text-ink-500 dark:text-muted-foreground mb-3.5">
                Course Details
              </h3>
              {[
                ["Duration", course.details.duration],
                ["Mode", course.details.mode],
                ["Level", course.details.level],
                ["Language", course.details.language],
              ].map(([k, v], i, arr) => (
                <div
                  key={k}
                  className={`flex justify-between items-center py-2.5 text-sm ${
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
                  {course.mentor.initials}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{course.mentor.name}</div>
                  <div className="text-xs text-ink-500 dark:text-muted-foreground">{course.mentor.role}</div>
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
          </div>
        </div>
      </div>
    </section>
  );
}

export function CourseSections() {
  return (
    <div id="courses">
      {COURSE_SECTIONS.map((course) => (
        <CourseSection key={course.id} course={course} />
      ))}
    </div>
  );
}
