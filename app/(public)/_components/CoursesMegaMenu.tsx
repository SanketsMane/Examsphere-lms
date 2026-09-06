"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CourseAccent } from "@/app/(public)/_data/courses-content";
import { PROGRAM_GROUPS, programsByGroup } from "@/app/(public)/_data/programs-content";

/**
 * "Courses" navigation.
 *
 * Every item links to its own programme page under /programs/<slug>. This used to
 * smooth-scroll to anchors on the homepage, which meant all programmes lived on one
 * long scrolling page and none of them were linkable, indexable or shareable.
 */

const iconAccent: Record<CourseAccent, string> = {
  navy: "text-navy-700 dark:text-blue-300",
  orange: "text-orange-500",
  green: "text-es-green-600 dark:text-emerald-400",
};

/** Desktop "Courses" trigger + 3-column mega-dropdown (hover + keyboard). */
export function CoursesMegaMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Link
        href="/programs"
        className="flex items-center gap-1.5 px-4 py-2 rounded font-semibold text-[15px] text-ink-700 dark:text-foreground hover:text-navy-900 dark:hover:text-white transition-colors"
        aria-expanded={open}
      >
        Courses
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </Link>

      <div
        className={`absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-[560px] bg-popover text-popover-foreground rounded-2xl shadow-[var(--shadow-es-lg)] border border-border p-5 grid grid-cols-3 gap-2 z-50 transition-all origin-top ${
          open
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible translate-y-1.5 pointer-events-none"
        }`}
      >
        {/* little bridge so hover doesn't drop between trigger and panel */}
        <div className="absolute -top-4 left-0 right-0 h-4" />
        {PROGRAM_GROUPS.map((group) => (
          <div key={group.id}>
            <Link
              href={`/programs#${group.id}`}
              onClick={() => setOpen(false)}
              className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-muted-foreground px-2.5 pt-1.5 pb-2 hover:text-navy-900 dark:hover:text-white transition-colors"
            >
              {group.label}
            </Link>
            {programsByGroup(group.id).map((program) => {
              const Icon = program.icon;
              return (
                <Link
                  key={program.slug}
                  href={`/programs/${program.slug}`}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold text-ink-700 dark:text-foreground text-left hover:bg-bg-soft dark:hover:bg-muted hover:text-navy-900 dark:hover:text-white transition-colors"
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${iconAccent[group.accent]}`} />
                  {program.navLabel}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mobile expandable "Courses" group used inside the mobile menu. */
export function CoursesMobileGroup({ onNavigate }: { onNavigate?: () => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-b border-border pb-3">
      <button
        type="button"
        className="w-full flex items-center justify-between text-foreground font-medium py-2"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        Courses
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="pl-2 pt-1 space-y-1">
          {PROGRAM_GROUPS.map((group) => (
            <div key={group.id} className="pb-1">
              <Link
                href={`/programs#${group.id}`}
                onClick={onNavigate}
                className="block text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-muted-foreground py-1"
              >
                {group.label}
              </Link>
              {programsByGroup(group.id).map((program) => {
                const Icon = program.icon;
                return (
                  <Link
                    key={program.slug}
                    href={`/programs/${program.slug}`}
                    onClick={onNavigate}
                    className="w-full flex items-center gap-2.5 py-2 text-sm font-medium text-ink-700 dark:text-muted-foreground text-left"
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${iconAccent[group.accent]}`} />
                    {program.navLabel}
                  </Link>
                );
              })}
            </div>
          ))}
          <Link
            href="/programs"
            onClick={onNavigate}
            className="block py-2 text-sm font-semibold text-navy-900 dark:text-blue-200"
          >
            View all programs →
          </Link>
        </div>
      )}
    </div>
  );
}
