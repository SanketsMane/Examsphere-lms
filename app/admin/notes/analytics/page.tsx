import Link from "next/link";
import { ArrowLeft, Download, Eye, Gift, IndianRupee, ReceiptText, ShoppingBag, Undo2, Users } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, StatCard } from "@/components/dashboard/es/dashboard-kit";
import { notesSalesSummary } from "@/lib/notes/queries";
import { formatRupeesFromPaise } from "@/lib/notes/validation";
import { SalesChart } from "../_components/SalesChart";

export const dynamic = "force-dynamic";

export default async function NotesAnalyticsPage() {
  await requireAdmin();
  const s = await notesSalesSummary(30);

  return (
    <div className="space-y-8">
      <Link href="/admin/notes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Notes
      </Link>
      <PageHeader title="Notes sales & analytics" subtitle="Paid sales count only active purchases; refunded ones are shown separately.">
        <Button variant="outline" asChild>
          <a href="/api/admin/notes/export"><Download className="mr-2 size-4" /> Export all (CSV)</a>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IndianRupee} label="Revenue · 30 days" value={formatRupeesFromPaise(s.recent.revenuePaise)} hint={`${s.recent.sales} sales`} accent="green" />
        <StatCard icon={ReceiptText} label="Revenue · all time" value={formatRupeesFromPaise(s.allTime.revenuePaise)} hint={`${s.allTime.sales} sales`} accent="navy" />
        <StatCard icon={Undo2} label="Refunded" value={formatRupeesFromPaise(s.refunds.amountPaise)} hint={`${s.refunds.count} refunds`} accent="orange" />
        <StatCard icon={Users} label="Readers with access" value={s.readers} hint={`${s.freeClaims} via free notes`} accent="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Daily revenue · last 30 days" icon={ShoppingBag}>
          <SalesChart data={s.daily} />
        </Panel>
        <Panel title="Engagement · 30 days" icon={Eye}>
          <ul className="space-y-4 text-sm">
            <li className="flex items-center justify-between"><span className="text-muted-foreground">Notes opened</span><span className="font-semibold tabular-nums">{s.views}</span></li>
            <li className="flex items-center justify-between"><span className="text-muted-foreground">Downloads</span><span className="font-semibold tabular-nums">{s.downloads}</span></li>
            <li className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><Gift className="size-4" /> Free notes claimed (all time)</span><span className="font-semibold tabular-nums">{s.freeClaims}</span></li>
          </ul>
        </Panel>
      </div>

      <Panel title="Top notes by revenue" icon={ReceiptText}>
        {s.top.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No paid sales yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="py-2">Note</th><th className="py-2">Sales</th><th className="py-2 text-right">Revenue</th></tr>
            </thead>
            <tbody>
              {s.top.map((t) => (
                <tr key={t.noteId} className="border-t border-border">
                  <td className="py-2"><Link href={`/admin/notes/${t.noteId}`} className="font-medium hover:text-primary">{t.title}</Link></td>
                  <td className="py-2 tabular-nums">{t.sales}</td>
                  <td className="py-2 text-right tabular-nums">{formatRupeesFromPaise(t.revenuePaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
