"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECTABLE_MODELS } from "@/lib/notes/ai/pricing";
import { updateNotesSettingsAction } from "../actions";

interface Values {
  refundWindowHours: number;
  refundMaxReadPercent: number;
  refundRequiresNoDownload: boolean;
  autoApproveRefunds: boolean;
  aiModel: string;
  aiMonthlyBudgetUsd: number;
}

/** Same wording as describeRefundPolicy() on the server, so the preview matches what students see. */
function policyText(v: Values) {
  if (v.refundWindowHours <= 0) return "Digital notes are non-refundable once purchased.";
  const w = v.refundWindowHours % 24 === 0 ? `${v.refundWindowHours / 24} day${v.refundWindowHours === 24 ? "" : "s"}` : `${v.refundWindowHours} hours`;
  const c = [`you've read no more than ${v.refundMaxReadPercent}% of the pages`];
  if (v.refundRequiresNoDownload) c.push("haven't downloaded the PDF");
  return `Refund available within ${w} of purchase if ${c.join(" and ")}.`;
}

export function NotesSettingsForm({ initial, spentUsd }: { initial: Values; spentUsd: number }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const r = await updateNotesSettingsAction(v);
      if (r.status === "success") toast.success(r.message);
      else toast.error(r.message);
    });

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <h2 className="font-display text-lg font-bold">Refund policy</h2>
        <div className="grid items-start gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Refund window (hours after purchase)</Label>
            <Input type="number" min={0} max={720} value={v.refundWindowHours} onChange={(e) => setV({ ...v, refundWindowHours: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">0 = no refunds. 48 = two days.</p>
          </div>
          <div className="space-y-2">
            <Label>Maximum read before refunds stop (%)</Label>
            <Input type="number" min={0} max={100} value={v.refundMaxReadPercent} onChange={(e) => setV({ ...v, refundMaxReadPercent: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Based on the furthest page the student opened.</p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={v.refundRequiresNoDownload} onCheckedChange={(x) => setV({ ...v, refundRequiresNoDownload: x })} />
            No refund once the PDF has been downloaded
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={v.autoApproveRefunds} onCheckedChange={(x) => setV({ ...v, autoApproveRefunds: x })} />
            Approve eligible requests automatically
          </label>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Students see</p>
          <p className="mt-1">{policyText(v)}</p>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="font-display text-lg font-bold">AI note generation</h2>
        <div className="grid items-start gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={v.aiModel} onValueChange={(x) => setV({ ...v, aiModel: x })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SELECTABLE_MODELS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Monthly budget (US$)</Label>
            <Input type="number" min={0} max={10000} value={v.aiMonthlyBudgetUsd} onChange={(e) => setV({ ...v, aiMonthlyBudgetUsd: Number(e.target.value) })} />
            <p className="text-xs text-muted-foreground">Used so far this month: about ${spentUsd.toFixed(2)}. New generations stop when the budget is reached.</p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />} Save settings
        </Button>
      </div>
    </div>
  );
}
