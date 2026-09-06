import * as React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Archive,
  Inbox,
} from "lucide-react";

/**
 * Shared UI for the admin Payments screens.
 *
 * These four pages (All Transactions, Withdraw Requests, Refund Requests,
 * Earnings & Fees) previously each invented their own header, status colours,
 * money formatting and table markup. That produced three different status
 * vocabularies and two different money formatters on screens whose whole job is
 * to be unambiguous about money. Everything below is the single source.
 */

/* ------------------------------------------------------------------ header */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {/* Fluid size: drops to 20px on small screens so long titles never wrap awkwardly. */}
        <h1 className="text-[clamp(1.25rem,1rem+1.2vw,1.75rem)] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ status */

/**
 * One status vocabulary for every payments screen.
 *
 * Tone is never carried by colour alone — each pill has an icon and a text
 * label, so the state is readable in greyscale and to colourblind users.
 * `pending` is deliberately amber and never green: money that has not settled
 * must never look settled.
 */
export type StatusTone = "success" | "pending" | "progress" | "failed" | "neutral";

const TONE: Record<StatusTone, { cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  // Explicit dark: variants — the previous badges used bg-*-100/text-*-800 only,
  // which glared on the dark theme.
  success: {
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25",
    Icon: CheckCircle2,
  },
  pending: {
    cls: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25",
    Icon: Clock,
  },
  progress: {
    cls: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/25",
    Icon: RotateCcw,
  },
  failed: {
    cls: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25",
    Icon: XCircle,
  },
  neutral: {
    cls: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
    Icon: Archive,
  },
};

/** Maps every status string used across enrollments, payouts and refunds. */
export function toneForStatus(status: string): StatusTone {
  switch (status) {
    case "Active":
    case "Completed":
    case "Processed":
    case "Success":
    case "Paid":
      return "success";
    case "Pending":
      return "pending";
    case "Approved":
    case "Processing":
      return "progress";
    case "Rejected":
    case "Failed":
    case "Cancelled":
      return "failed";
    default:
      return "neutral";
  }
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const tone = TONE[toneForStatus(status)];
  const { Icon } = tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        tone.cls,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------- money */

/**
 * Money is the visual anchor on these screens: tabular numerals so columns of
 * figures align digit-for-digit, and never truncated.
 */
export function Money({
  children,
  className,
  muted,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums whitespace-nowrap",
        muted ? "text-muted-foreground" : "text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- stat tiles */

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "pending";
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold tabular-nums tracking-tight",
          tone === "pending" ? "text-amber-600 dark:text-amber-400" : "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ empty states */

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="rounded-full bg-red-50 p-3 dark:bg-red-500/10">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">Couldn&apos;t load this data</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- surfaces */

/** A titled panel. Plain border, no shadow stack — these are data screens. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Horizontal scroll container for wide tables.
 *
 * Tables here have 6–7 columns and previously overflowed the viewport on phones
 * with no way to reach the far columns. Each page also renders a card list at
 * `sm` and below; this keeps the tablet range usable.
 */
export function TableScroll({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

/** Row used by the mobile card layout that replaces the table under `sm`. */
export function MobileRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}
