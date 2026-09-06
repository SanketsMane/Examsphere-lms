import { requireAdmin } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateRefundStatus } from "@/app/actions/refunds";
import { Check, X, ReceiptText } from "lucide-react";
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

function fullDate(d: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

export default async function RefundsPage() {
  // Server-side guard — see the note in payouts/page.tsx.
  await requireAdmin();

  let refunds;
  try {
    refunds = await prisma.refundRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    });
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader title="Refund Requests" description="Student refund requests awaiting review." />
        <Panel>
          <ErrorState message="The refund records could not be loaded. Refresh to try again." />
        </Panel>
      </div>
    );
  }

  const pending = refunds.filter((r) => r.status === "Pending");
  // RefundRequest.amount is stored in whole rupees (Int), like Course.price.
  const pendingTotal = pending.reduce((s, r) => s + (r.amount ?? 0), 0);
  const refundedTotal = refunds
    .filter((r) => r.status === "Processed")
    .reduce((s, r) => s + (r.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund Requests"
        description="Review student refund requests. Approving a refund returns money to the student and cannot be undone here."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Awaiting review" value={String(pending.length)} tone="pending" />
        <StatCard
          label="Pending value"
          value={formatMoney(pendingTotal)}
          tone="pending"
          hint="Not yet refunded"
        />
        <StatCard label="Refunded" value={formatMoney(refundedTotal)} hint="Processed to date" />
        <StatCard label="Total requests" value={String(refunds.length)} />
      </div>

      <Panel
        title="All requests"
        description={refunds.length ? `Showing ${refunds.length} most recent` : undefined}
      >
        {refunds.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No refund requests"
            description="When a student requests a refund, it will appear here for review."
          />
        ) : (
          <>
            <TableScroll>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Requested</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {fullDate(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="line-clamp-2 text-sm">{r.course?.title ?? "—"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money>{formatMoney(r.amount)}</Money>
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        {/* Reasons wrap rather than truncate to a title attribute,
                            which was unreadable on touch devices. */}
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {r.reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <RefundActions refund={r} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>

            <ul className="divide-y md:hidden">
              {refunds.map((r) => (
                <li key={r.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.user.email}</p>
                    </div>
                    <StatusPill status={r.status} />
                  </div>
                  <MobileRow label="Amount">
                    <Money>{formatMoney(r.amount)}</Money>
                  </MobileRow>
                  <MobileRow label="Course">
                    <span className="text-sm">{r.course?.title ?? "—"}</span>
                  </MobileRow>
                  <MobileRow label="Reason">
                    <span className="text-sm text-muted-foreground">{r.reason}</span>
                  </MobileRow>
                  <MobileRow label="Requested">
                    <span className="text-xs text-muted-foreground">{fullDate(r.createdAt)}</span>
                  </MobileRow>
                  <div className="pt-1">
                    <RefundActions refund={r} />
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

function RefundActions({ refund: r }: { refund: any }) {
  if (r.status !== "Pending") {
    return <span className="text-xs text-muted-foreground">No action needed</span>;
  }

  const details = [
    { label: "Student", value: r.user.name },
    { label: "Course", value: r.course?.title ?? "—" },
    { label: "Refund amount", value: formatMoney(r.amount) },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      <ConfirmAction
        action={async () => {
          "use server";
          await updateRefundStatus(r.id, "Approved");
        }}
        title="Approve this refund?"
        description="This returns the amount to the student. It cannot be undone from this screen."
        details={details}
        confirmLabel="Approve refund"
        successMessage="Refund approved"
        trigger={
          <ActionButton tone="approve">
            <Check className="mr-1.5 h-4 w-4" /> Approve
          </ActionButton>
        }
      />
      <ConfirmAction
        action={async () => {
          "use server";
          await updateRefundStatus(r.id, "Rejected");
        }}
        title="Reject this refund?"
        description="The student will be told their refund request was declined."
        details={details}
        confirmLabel="Reject request"
        destructive
        successMessage="Refund rejected"
        trigger={
          <ActionButton tone="reject">
            <X className="mr-1.5 h-4 w-4" /> Reject
          </ActionButton>
        }
      />
    </div>
  );
}
