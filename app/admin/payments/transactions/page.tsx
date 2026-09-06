import { requireAdmin } from "@/app/data/auth/require-roles";
import { prisma as db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Receipt } from "lucide-react";
import {
  PageHeader,
  Panel,
  StatusPill,
  Money,
  StatCard,
  EmptyState,
  ErrorState,
  TableScroll,
  MobileRow,
} from "../_components/payments-ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function fullDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

/** Provider statuses are UPPER_SNAKE; render them as readable words. */
function prettyStatus(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();

  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  let transactions: any[] = [];
  let total = 0;
  try {
    [transactions, total] = await Promise.all([
      db.systemTransaction.findMany({
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { name: true, email: true } } },
      }),
      db.systemTransaction.count(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader title="All Transactions" description="Every payment processed through the platform." />
        <Panel>
          <ErrorState message="Transaction records could not be loaded. Refresh to try again." />
        </Panel>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const succeeded = transactions.filter((t) => t.status === "SUCCESS" || t.status === "PAID");
  const settledValue = succeeded.reduce((s, t) => s + (t.amount ?? 0), 0);
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
  const currency = transactions[0]?.currency || "INR";

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Transactions"
        description="Every payment processed through the platform, newest first."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total transactions" value={total.toLocaleString("en-IN")} />
        <StatCard
          label="Settled on this page"
          value={formatMoney(settledValue, { currency })}
          hint={`${succeeded.length} succeeded`}
        />
        <StatCard label="Pending on this page" value={String(pendingCount)} tone="pending" />
        <StatCard label="Page" value={`${currentPage} of ${totalPages}`} />
      </div>

      <Panel
        title="Transaction log"
        description={total ? `${total.toLocaleString("en-IN")} records` : undefined}
      >
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Payments will appear here as soon as the first one is processed."
          />
        ) : (
          <>
            <TableScroll>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {fullDate(t.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <span className="line-clamp-2 text-sm">{t.description}</span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.user?.name ?? "—"}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.user?.email ?? ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          {t.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money>{formatMoney(t.amount, { currency: t.currency || "INR" })}</Money>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={prettyStatus(t.status)} />
                      </TableCell>
                      <TableCell>
                        {/* Reference ids must be visible and selectable for support
                            to trace a payment with the provider. */}
                        <span className="select-all font-mono text-xs text-muted-foreground">
                          {t.providerPaymentId || t.providerOrderId || "—"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>

            <ul className="divide-y md:hidden">
              {transactions.map((t) => (
                <li key={t.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 text-sm font-medium">{t.description}</p>
                    <StatusPill status={prettyStatus(t.status)} />
                  </div>
                  <MobileRow label="Amount">
                    <Money>{formatMoney(t.amount, { currency: t.currency || "INR" })}</Money>
                  </MobileRow>
                  <MobileRow label="User">
                    <span className="text-sm">{t.user?.name ?? "—"}</span>
                  </MobileRow>
                  <MobileRow label="Type">
                    <span className="text-xs">{t.type}</span>
                  </MobileRow>
                  <MobileRow label="Reference">
                    <span className="select-all font-mono text-xs">
                      {t.providerPaymentId || t.providerOrderId || "—"}
                    </span>
                  </MobileRow>
                  <MobileRow label="Date">
                    <span className="text-xs text-muted-foreground">{fullDate(t.createdAt)}</span>
                  </MobileRow>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="flex items-center justify-between gap-3 border-t px-4 py-3"
              >
                <p className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  {/* Rendered as links only when they lead somewhere. The previous
                      version put `disabled` on an <a>, which does nothing. */}
                  {currentPage > 1 ? (
                    <a
                      href={`/admin/payments/transactions?page=${currentPage - 1}`}
                      className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-accent"
                    >
                      Previous
                    </a>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-md border px-3 text-sm text-muted-foreground opacity-50">
                      Previous
                    </span>
                  )}
                  {currentPage < totalPages ? (
                    <a
                      href={`/admin/payments/transactions?page=${currentPage + 1}`}
                      className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-accent"
                    >
                      Next
                    </a>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-md border px-3 text-sm text-muted-foreground opacity-50">
                      Next
                    </span>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
