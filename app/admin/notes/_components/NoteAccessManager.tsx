"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Loader2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { grantNoteAccessAction, refundNotePurchaseAction, revokeNoteAccessAction } from "../actions";

export interface AccessRow {
  id: string;
  name: string;
  email: string;
  source: string;
  status: string;
  amountPaise: number;
  date: string;
  lastReadPage: number | null;
  downloadCount: number;
  paymentId: string | null;
}

const SOURCE: Record<string, string> = { PURCHASE: "Razorpay", WALLET: "Wallet", FREE: "Free", COURSE: "Course", ADMIN_GRANT: "Granted" };
const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-es-green-600/10 text-es-green-700 dark:text-emerald-400",
  REFUNDED: "bg-orange-500/10 text-orange-600",
  REVOKED: "bg-destructive/10 text-destructive",
};

export function NoteAccessManager({ noteId, rows, pageCount }: { noteId: string; rows: AccessRow[]; pageCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<{ kind: "revoke" | "refund"; row: AccessRow } | null>(null);
  const [reason, setReason] = useState("");

  const shown = rows.filter((r) => !query || `${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase()));

  function grant() {
    startTransition(async () => {
      const r = await grantNoteAccessAction(noteId, email);
      if (r.status === "success") {
        toast.success(r.message);
        setEmail("");
        router.refresh();
      } else toast.error(r.message);
    });
  }

  function confirmAction() {
    if (!action) return;
    startTransition(async () => {
      const r =
        action.kind === "refund"
          ? await refundNotePurchaseAction(noteId, action.row.id, reason)
          : await revokeNoteAccessAction(noteId, action.row.id, reason);
      if (r.status === "success") {
        toast.success(r.message);
        setAction(null);
        setReason("");
        router.refresh();
      } else toast.error(r.message);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full gap-2 md:max-w-md">
          <Input placeholder="student@email.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Button onClick={grant} disabled={!email || pending}>
            <UserPlus className="mr-2 size-4" /> Give access
          </Button>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} className="md:w-56" />
          <Button variant="outline" asChild>
            <a href={`/api/admin/notes/export?noteId=${noteId}`}>
              <Download className="mr-2 size-4" /> CSV
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Access</th>
              <th className="px-4 py-2">Paid</th>
              <th className="px-4 py-2">Since</th>
              <th className="px-4 py-2">Read</th>
              <th className="px-4 py-2">Downloads</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No one has access yet.</td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col gap-1">
                    <span>{SOURCE[r.source] ?? r.source}</span>
                    <Badge variant="outline" className={`w-fit border-0 ${STATUS_STYLE[r.status] ?? ""}`}>{r.status.toLowerCase()}</Badge>
                  </div>
                </td>
                <td className="px-4 py-2 tabular-nums">{r.amountPaise ? `₹${(r.amountPaise / 100).toLocaleString("en-IN")}` : "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(r.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                <td className="px-4 py-2 tabular-nums">
                  {r.lastReadPage ? `p.${r.lastReadPage}/${pageCount} (${Math.round((r.lastReadPage / Math.max(1, pageCount)) * 100)}%)` : "—"}
                </td>
                <td className="px-4 py-2 tabular-nums">{r.downloadCount}</td>
                <td className="px-4 py-2 text-right">
                  {r.status === "ACTIVE" && (
                    <div className="flex justify-end gap-1">
                      {(r.source === "PURCHASE" || r.source === "WALLET") && r.amountPaise > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => setAction({ kind: "refund", row: r })}>Refund</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setAction({ kind: "revoke", row: r })}>
                        Revoke
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!action} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.kind === "refund" ? "Refund and remove access?" : "Remove access?"}</DialogTitle>
            <DialogDescription>
              {action?.kind === "refund"
                ? action.row.source === "WALLET"
                  ? `₹${((action?.row.amountPaise ?? 0) / 100).toLocaleString("en-IN")} goes back to ${action?.row.email}'s wallet.`
                  : `₹${((action?.row.amountPaise ?? 0) / 100).toLocaleString("en-IN")} is refunded to ${action?.row.email}'s original payment method through Razorpay.`
                : `${action?.row.email} will no longer be able to open these notes. No money is moved.`}
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="Reason (kept in the record)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)} disabled={pending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmAction} disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {action?.kind === "refund" ? "Refund" : "Revoke"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
