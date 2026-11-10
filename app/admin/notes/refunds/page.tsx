import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/dashboard/es/dashboard-kit";
import { describeRefundPolicy, getNotesSettings } from "@/lib/notes/settings";
import { formatRupeesFromPaise } from "@/lib/notes/validation";
import { RefundDecision } from "../_components/RefundDecision";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  PENDING: "bg-orange-500/10 text-orange-600",
  APPROVED: "bg-es-green-600/10 text-es-green-700",
  REJECTED: "bg-muted text-muted-foreground",
};

export default async function NoteRefundsPage() {
  await requireAdmin();
  const [requests, settings] = await Promise.all([
    prisma.noteRefundRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        note: { select: { id: true, title: true, currentVersion: { select: { pageCount: true } } } },
        entitlement: { select: { amountPaise: true, source: true, maxReadPage: true, downloadCount: true, activatedAt: true, user: { select: { name: true, email: true } } } },
      },
    }),
    getNotesSettings(),
  ]);
  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <Link href="/admin/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Notes
      </Link>
      <PageHeader title="Refund requests" subtitle={`${pending} waiting · Policy: ${describeRefundPolicy(settings)}`}>
        <Link href="/admin/notes/settings" className="text-sm font-medium text-primary hover:underline">Change policy</Link>
      </PageHeader>
      <Panel>
        {requests.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No refund requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2">Student</th>
                  <th className="py-2">Note</th>
                  <th className="py-2">Paid</th>
                  <th className="py-2">Read</th>
                  <th className="py-2">Reason</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const pages = r.note.currentVersion?.pageCount ?? 1;
                  const read = r.entitlement.maxReadPage ? Math.round((r.entitlement.maxReadPage / pages) * 100) : 0;
                  return (
                    <tr key={r.id} className="border-t border-border align-top">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{r.entitlement.user.name}</p>
                        <p className="text-xs text-muted-foreground">{r.entitlement.user.email}</p>
                        <p className="text-xs text-muted-foreground">{r.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </td>
                      <td className="py-3 pr-3"><Link href={`/admin/notes/${r.note.id}`} className="hover:text-primary">{r.note.title}</Link></td>
                      <td className="py-3 pr-3 tabular-nums">{formatRupeesFromPaise(r.entitlement.amountPaise)}<p className="text-xs text-muted-foreground">{r.entitlement.source === "WALLET" ? "Wallet" : "Razorpay"}</p></td>
                      <td className="py-3 pr-3 tabular-nums">{read}%{r.entitlement.downloadCount > 0 && <p className="text-xs text-orange-600">downloaded</p>}</td>
                      <td className="max-w-xs py-3 pr-3 text-muted-foreground">{r.reason}</td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" className={`border-0 ${STATUS[r.status]}`}>{r.status.toLowerCase()}</Badge>
                        {r.adminNote && <p className="mt-1 text-xs text-muted-foreground">{r.adminNote}</p>}
                      </td>
                      <td className="py-3">{r.status === "PENDING" ? <RefundDecision requestId={r.id} /> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
