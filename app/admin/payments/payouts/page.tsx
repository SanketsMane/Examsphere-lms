import { requireAdmin } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { formatMoney, maskAccountNumber } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updatePayoutStatus } from "@/app/actions/admin-payouts";
import { Check, X, Wallet, Banknote } from "lucide-react";
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
import { ConfirmAction, ActionButton } from "../_components/confirm-action";

export const dynamic = "force-dynamic";

/** Payout amounts are Decimal in the DB; render via the row's own currency column. */
function payoutAmount(amount: unknown, currency: string) {
  return formatMoney(Number(amount ?? 0), { currency: currency || "USD", showDecimals: true });
}

function fullDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function PayoutsPage() {
  // Server-side guard. app/admin/layout.tsx is a client component, so its role
  // check only runs after the server has already rendered and sent this page —
  // which meant any signed-in user could read teacher bank details from here.
  await requireAdmin();

  let payouts;
  try {
    payouts = await prisma.payoutRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        teacher: { include: { user: { select: { name: true, email: true } } } },
      },
    });
  } catch (e) {
    return (
      <div className="space-y-6">
        <PageHeader title="Withdraw Requests" description="Teacher payout requests awaiting review." />
        <Panel>
          <ErrorState message="The payout records could not be loaded. Refresh to try again." />
        </Panel>
      </div>
    );
  }

  const pending = payouts.filter((p) => p.status === "Pending");
  const approved = payouts.filter((p) => p.status === "Approved");
  const pendingTotal = pending.reduce((sum, p) => sum + Number(p.requestedAmount ?? 0), 0);
  const currency = payouts[0]?.currency || "USD";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Withdraw Requests"
        description="Review and approve teacher payout requests. Approving releases money and cannot be undone here."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Awaiting review" value={String(pending.length)} tone="pending" />
        <StatCard
          label="Pending value"
          value={formatMoney(pendingTotal, { currency, showDecimals: true })}
          tone="pending"
          hint="Not yet paid out"
        />
        <StatCard label="Approved" value={String(approved.length)} hint="Ready to mark paid" />
        <StatCard label="Total requests" value={String(payouts.length)} />
      </div>

      <Panel
        title="All requests"
        description={payouts.length ? `Showing ${payouts.length} most recent` : undefined}
      >
        {payouts.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No withdrawal requests yet"
            description="When a teacher requests a payout, it will appear here for review."
          />
        ) : (
          <>
            {/* ---------- Desktop / tablet: table ---------- */}
            <TableScroll>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Requested</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Bank account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {fullDate(p.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.teacher.user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.teacher.user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money>{payoutAmount(p.requestedAmount, p.currency)}</Money>
                        {p.netAmount != null && (
                          <p className="text-xs text-muted-foreground">
                            Net {payoutAmount(p.netAmount, p.currency)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{p.bankName || "—"}</p>
                          {/* Masked: full account numbers must never appear in a list. */}
                          <p className="font-mono text-xs text-muted-foreground">
                            {maskAccountNumber(p.bankAccountNumber)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PayoutActions payout={p} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>

            {/* ---------- Mobile: cards ---------- */}
            <ul className="divide-y md:hidden">
              {payouts.map((p) => (
                <li key={p.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.teacher.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.teacher.user.email}
                      </p>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                  <MobileRow label="Amount">
                    <Money>{payoutAmount(p.requestedAmount, p.currency)}</Money>
                  </MobileRow>
                  <MobileRow label="Bank">
                    <span className="text-sm">{p.bankName || "—"}</span>
                  </MobileRow>
                  <MobileRow label="Account">
                    <span className="font-mono text-xs">
                      {maskAccountNumber(p.bankAccountNumber)}
                    </span>
                  </MobileRow>
                  <MobileRow label="Requested">
                    <span className="text-xs text-muted-foreground">{fullDate(p.createdAt)}</span>
                  </MobileRow>
                  <div className="pt-1">
                    <PayoutActions payout={p} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}

/**
 * Approve / reject / mark-paid.
 *
 * Every one of these is irreversible from this screen, so each goes through a
 * review dialog showing the teacher, the amount, and the fee/net breakdown
 * before it can be confirmed.
 */
function PayoutActions({ payout: p }: { payout: any }) {
  const amount = payoutAmount(p.requestedAmount, p.currency);
  const details = [
    { label: "Teacher", value: p.teacher.user.name },
    { label: "Bank", value: p.bankName || "—" },
    { label: "Account", value: maskAccountNumber(p.bankAccountNumber) },
    { label: "Requested amount", value: amount },
    ...(p.processingFee != null
      ? [{ label: "Processing fee", value: payoutAmount(p.processingFee, p.currency) }]
      : []),
    ...(p.netAmount != null
      ? [{ label: "Net to teacher", value: payoutAmount(p.netAmount, p.currency) }]
      : []),
  ];

  if (p.status === "Pending") {
    return (
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <ConfirmAction
          action={async () => {
            "use server";
            await updatePayoutStatus(p.id, "Approved");
          }}
          title="Approve this withdrawal?"
          description="This approves the payout for release. It cannot be undone from this screen."
          details={details}
          confirmLabel="Approve payout"
          successMessage="Withdrawal approved"
          trigger={
            <ActionButton tone="approve">
              <Check className="mr-1.5 h-4 w-4" /> Approve
            </ActionButton>
          }
        />
        <ConfirmAction
          action={async () => {
            "use server";
            await updatePayoutStatus(p.id, "Rejected");
          }}
          title="Reject this withdrawal?"
          description="The teacher will be told the request was declined. This cannot be undone."
          details={details}
          confirmLabel="Reject request"
          destructive
          successMessage="Withdrawal rejected"
          trigger={
            <ActionButton tone="reject">
              <X className="mr-1.5 h-4 w-4" /> Reject
            </ActionButton>
          }
        />
      </div>
    );
  }

  if (p.status === "Approved") {
    return (
      <div className="md:text-right">
        <ConfirmAction
          action={async () => {
            "use server";
            await updatePayoutStatus(p.id, "Completed");
          }}
          title="Mark this payout as paid?"
          description="Only do this once the transfer has actually left the account. It cannot be undone."
          details={details}
          confirmLabel="Mark as paid"
          successMessage="Payout marked as paid"
          trigger={
            <ActionButton>
              <Banknote className="mr-1.5 h-4 w-4" /> Mark paid
            </ActionButton>
          }
        />
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">No action needed</span>;
}
