"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decideRefundAction } from "../actions";

export function RefundDecision({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const decide = (approve: boolean) =>
    start(async () => {
      const r = await decideRefundAction(requestId, approve, note);
      if (r.status === "success") {
        toast.success(r.message);
        router.refresh();
      } else toast.error(r.message);
    });
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input placeholder="Note to student (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="h-8 sm:w-56" maxLength={300} />
      <div className="flex gap-1">
        <Button size="sm" onClick={() => decide(true)} disabled={pending}>
          {pending && <Loader2 className="mr-1 size-3.5 animate-spin" />} Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide(false)} disabled={pending}>Decline</Button>
      </div>
    </div>
  );
}
