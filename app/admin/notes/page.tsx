import Link from "next/link";
import { BookOpenText, ChartColumn, IndianRupee, Plus, ShoppingBag, Users } from "lucide-react";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, StatCard } from "@/components/dashboard/es/dashboard-kit";
import { adminListNotes, coverUrl } from "@/lib/notes/queries";
import { formatRupeesFromPaise } from "@/lib/notes/validation";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PROCESSING: "bg-sky-500/10 text-sky-600",
  REVIEW: "bg-violet-500/10 text-violet-600",
  PUBLISHED: "bg-es-green-600/10 text-es-green-700 dark:text-emerald-400",
  ARCHIVED: "bg-orange-500/10 text-orange-600",
};
const ACCESS: Record<string, string> = { FREE: "Free", PAID: "Paid", COURSE_ONLY: "Course only" };

export default async function AdminNotesPage() {
  await requireAdmin();
  const notes = await adminListNotes();
  const published = notes.filter((n) => n.status === "PUBLISHED").length;
  const sales = notes.reduce((s, n) => s + n.sales, 0);
  const revenue = notes.reduce((s, n) => s + n.revenuePaise, 0);
  const readers = notes.reduce((s, n) => s + n.readers, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Notes" subtitle="Upload study notes, sell them, give them free, or include them with courses.">
        <Button variant="outline" asChild>
          <Link href="/admin/notes/analytics"><ChartColumn className="mr-2 size-4" /> Sales &amp; analytics</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/notes/new"><Plus className="mr-2 size-4" /> New note</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpenText} label="Published" value={`${published} / ${notes.length}`} accent="navy" />
        <StatCard icon={ShoppingBag} label="Paid sales" value={sales} accent="orange" />
        <StatCard icon={IndianRupee} label="Revenue" value={formatRupeesFromPaise(revenue)} hint="Excludes refunds" accent="green" />
        <StatCard icon={Users} label="Readers with access" value={readers} accent="violet" />
      </div>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-16 text-center">
          <BookOpenText className="size-10 text-muted-foreground" />
          <p className="font-display text-lg font-bold">No notes yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Create a note, upload its PDF, set a price (or make it free), then publish.</p>
          <Button asChild className="mt-2"><Link href="/admin/notes/new">Create your first note</Link></Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Pages</th>
                <th className="px-4 py-3">Sales</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Readers</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((n) => {
                const cover = coverUrl(n);
                return (
                  <tr key={n.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/notes/${n.id}`} className="flex items-center gap-3">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element -- our own resized image
                          <img src={cover} alt="" className="h-12 w-9 rounded object-cover" />
                        ) : (
                          <div className="flex h-12 w-9 items-center justify-center rounded bg-muted"><BookOpenText className="size-4 text-muted-foreground" /></div>
                        )}
                        <span className="font-medium hover:text-primary">{n.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className={`border-0 ${STATUS[n.status]}`}>{n.status.toLowerCase()}</Badge></td>
                    <td className="px-4 py-3">{ACCESS[n.accessType]}{n._count.courses > 0 && <span className="text-xs text-muted-foreground"> · {n._count.courses} course{n._count.courses > 1 ? "s" : ""}</span>}</td>
                    <td className="px-4 py-3 tabular-nums">{n.accessType === "PAID" ? formatRupeesFromPaise(n.discountPricePaise ?? n.pricePaise) : "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{n.currentVersion?.pageCount ?? <span className="text-orange-600">no PDF</span>}</td>
                    <td className="px-4 py-3 tabular-nums">{n.sales}</td>
                    <td className="px-4 py-3 tabular-nums">{formatRupeesFromPaise(n.revenuePaise)}</td>
                    <td className="px-4 py-3 tabular-nums">{n.readers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
