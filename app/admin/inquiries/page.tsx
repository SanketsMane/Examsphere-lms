import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { Search, Download, Inbox, MessageSquare, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/data/auth/require-roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { INQUIRY_STATUSES, STATUS_STYLES } from "./constants";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type SP = { q?: string; status?: string; page?: string };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;

  const q = (sp.q || "").trim();
  const status = INQUIRY_STATUSES.includes(sp.status as any) ? sp.status! : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const [items, total, grouped] = await Promise.all([
    prisma.chatInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.chatInquiry.count({ where }),
    prisma.chatInquiry.groupBy({ by: ["status"], _count: true }),
  ]);

  const counts = grouped.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count as unknown as number;
    return acc;
  }, {});
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildQuery = (patch: Partial<SP>) => {
    const params = new URLSearchParams();
    const merged = { q, status, ...patch };
    if (merged.q) params.set("q", merged.q);
    if (merged.status) params.set("status", merged.status);
    if (merged.page && Number(merged.page) > 1) params.set("page", String(merged.page));
    const s = params.toString();
    return s ? `/admin/inquiries?${s}` : "/admin/inquiries";
  };

  const stats = [
    { label: "Total leads", value: totalAll, tone: "text-foreground" },
    { label: "New", value: counts.new || 0, tone: "text-blue-600 dark:text-blue-400" },
    { label: "Contacted", value: counts.contacted || 0, tone: "text-amber-600 dark:text-amber-400" },
    { label: "Qualified", value: counts.qualified || 0, tone: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" /> Inquiries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leads captured from the website chatbot, with full conversation history.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/admin/inquiries/export${status ? `?status=${status}` : ""}`}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className={cn("text-2xl font-bold mt-1", s.tone)}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/inquiries" method="GET" className="relative flex-1 min-w-[220px] max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or phone…"
            className="pl-9"
          />
        </form>

        <div className="flex flex-wrap gap-1.5">
          <FilterTab href={buildQuery({ status: "", page: "1" })} active={!status} label={`All (${totalAll})`} />
          {INQUIRY_STATUSES.map((s) => (
            <FilterTab
              key={s}
              href={buildQuery({ status: s, page: "1" })}
              active={status === s}
              label={`${s} (${counts[s] || 0})`}
            />
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Msgs</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No inquiries found.
                  </TableCell>
                </TableRow>
              )}
              {items.map((it) => (
                <TableRow key={it.id} className="group">
                  <TableCell>
                    <Link href={`/admin/inquiries/${it.id}`} className="font-medium hover:underline">
                      {it.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{it.email}</div>
                    <div className="text-xs text-muted-foreground">{it.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize border", STATUS_STYLES[it.status])}>
                      {it.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {it.messageCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {it.lastMessageAt ? formatDistanceToNow(it.lastMessageAt, { addSuffix: true }) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(it.createdAt, "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/inquiries/${it.id}`}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} result{total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" disabled={page <= 1}>
              <Link href={buildQuery({ page: String(page - 1) })}>Previous</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
              <Link href={buildQuery({ page: String(page + 1) })}>Next</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterTab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-muted-foreground border-border hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
