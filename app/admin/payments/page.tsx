import { requireAdmin } from "@/app/data/auth/require-roles";
import { prisma as db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { ChevronRight, Receipt, Wallet, ReceiptText, Banknote } from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  Money,
  StatCard,
  EmptyState,
  ErrorState,
} from "./_components/payments-ui";

export const dynamic = "force-dynamic";

function fullDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

const SECTIONS = [
  {
    href: "/admin/payments/transactions",
    icon: Receipt,
    title: "All Transactions",
    description: "Every payment processed, with provider references.",
  },
  {
    href: "/admin/payments/payouts",
    icon: Wallet,
    title: "Withdraw Requests",
    description: "Review and approve teacher payouts.",
  },
  {
    href: "/admin/payments/refunds",
    icon: ReceiptText,
    title: "Refund Requests",
    description: "Review student refund requests.",
  },
  {
    href: "/admin/finance",
    icon: Banknote,
    title: "Earnings & Fees",
    description: "Commission, tax and currency settings.",
  },
];

export default async function PaymentsPage() {
  await requireAdmin();

  let recent: any[] = [];
  let totals = { revenue: 0, pendingValue: 0, total: 0, active: 0, pending: 0 };
  let queue = { payouts: 0, refunds: 0 };

  try {
    const [enrollments, revenueAgg, pendingAgg, total, active, pending, payoutQ, refundQ] =
      await Promise.all([
        db.enrollment.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { User: { select: { name: true } }, Course: { select: { title: true } } },
        }),
        db.enrollment.aggregate({ where: { status: "Active" }, _sum: { amount: true } }),
        db.enrollment.aggregate({ where: { status: "Pending" }, _sum: { amount: true } }),
        db.enrollment.count(),
        db.enrollment.count({ where: { status: "Active" } }),
        db.enrollment.count({ where: { status: "Pending" } }),
        db.payoutRequest.count({ where: { status: "Pending" } }),
        db.refundRequest.count({ where: { status: "Pending" } }),
      ]);

    recent = enrollments;
    totals = {
      // Enrollment.amount is whole rupees. The previous code used
      // currency.formatPrice(), which divides by 100 because it expects paise —
      // so a Rs 499 sale was reported here as Rs 4.99.
      revenue: revenueAgg._sum.amount ?? 0,
      pendingValue: pendingAgg._sum.amount ?? 0,
      total,
      active,
      pending,
    };
    queue = { payouts: payoutQ, refunds: refundQ };
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="Revenue, payouts and refunds across the platform." />
        <Panel>
          <ErrorState message="Payment data could not be loaded. Refresh to try again." />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Revenue, payouts and refunds across the platform."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Settled revenue"
          value={formatMoney(totals.revenue)}
          hint={`${totals.active} active enrolments`}
        />
        <StatCard
          label="Pending revenue"
          value={formatMoney(totals.pendingValue)}
          tone="pending"
          hint={`${totals.pending} awaiting payment`}
        />
        <StatCard label="Total enrolments" value={totals.total.toLocaleString("en-IN")} />
        <StatCard
          label="Needs review"
          value={String(queue.payouts + queue.refunds)}
          tone={queue.payouts + queue.refunds > 0 ? "pending" : "default"}
          hint={`${queue.payouts} payouts · ${queue.refunds} refunds`}
        />
      </div>

      {/* Section links. The sidebar already nests these four; this repeats them
          as an overview rather than adding a second tab bar on the page. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <span className="rounded-md bg-muted p-2 text-muted-foreground">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.description}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>

      <Panel
        title="Recent enrolments"
        actions={
          <Link
            href="/admin/payments/transactions"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all transactions
          </Link>
        }
      >
        {recent.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No enrolments yet"
            description="Course purchases will appear here as they happen."
          />
        ) : (
          <ul className="divide-y">
            {recent.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.Course?.title ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.User?.name ?? "—"} · {fullDate(e.createdAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Money>{formatMoney(e.amount ?? 0)}</Money>
                  <StatusPill status={e.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
