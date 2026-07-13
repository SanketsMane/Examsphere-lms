import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared, on-brand dashboard building blocks used by the student, teacher and admin
 * overview pages so they read as one polished, consistent product.
 */

export type Accent = "navy" | "orange" | "green" | "violet" | "sky";

const accentTile: Record<Accent, string> = {
  navy: "bg-navy-900/10 text-navy-900 dark:bg-blue-500/15 dark:text-blue-300",
  orange: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  green: "bg-es-green-600/10 text-es-green-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  sky: "bg-sky-500/10 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
};

const accentBar: Record<Accent, string> = {
  navy: "bg-navy-900",
  orange: "bg-orange-500",
  green: "bg-es-green-600",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
};

/* ------------------------------ Page header ------------------------------ */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-950 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-ink-500 dark:text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
}

/* ------------------------------ Stat card ------------------------------ */
export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "navy",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: Accent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-es-sm)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-es-md)]",
        className
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", accentBar[accent])} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-navy-950 dark:text-white truncate">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
            accentTile[accent]
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      {hint && (
        <p className="mt-3 text-xs font-medium text-ink-500 dark:text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/* ------------------------------ Panel ------------------------------ */
export function Panel({
  title,
  icon: Icon,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: React.ReactNode;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[var(--shadow-es-sm)]",
        className
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy-950 dark:text-white">
            {Icon && <Icon className="size-4 text-orange-500" />}
            {title}
          </h2>
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-900 hover:text-orange-500 dark:text-blue-300"
            >
              {action.label}
              <ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------ Progress bar ------------------------------ */
export function ProgressBar({ value, accent = "navy" }: { value: number; accent?: Accent }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg-soft dark:bg-muted">
      <div
        className={cn("h-full rounded-full transition-all duration-500", accentBar[accent])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
