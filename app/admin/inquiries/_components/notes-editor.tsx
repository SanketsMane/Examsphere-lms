"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateInquiryNotes } from "../actions";

export function NotesEditor({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [pending, startTransition] = useTransition();
  const dirty = notes !== initial;

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add internal notes about this lead (follow-ups, call outcomes, course interest)…"
        rows={5}
        className="resize-y"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={pending || !dirty}
          onClick={() =>
            startTransition(async () => {
              const res = await updateInquiryNotes(id, notes);
              if (res?.error) toast.error(res.error);
              else toast.success("Notes saved");
            })
          }
        >
          {pending ? "Saving…" : "Save notes"}
        </Button>
      </div>
    </div>
  );
}
