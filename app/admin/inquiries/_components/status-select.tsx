"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateInquiryStatus } from "../actions";
import { INQUIRY_STATUSES } from "../constants";

export function StatusSelect({ id, value }: { id: string; value: string }) {
  const [status, setStatus] = useState(value);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(v) => {
        const prev = status;
        setStatus(v);
        startTransition(async () => {
          const res = await updateInquiryStatus(id, v);
          if (res?.error) {
            setStatus(prev);
            toast.error(res.error);
          } else {
            toast.success("Status updated");
          }
        });
      }}
    >
      <SelectTrigger className="w-[150px] capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {INQUIRY_STATUSES.map((s) => (
          <SelectItem key={s} value={s} className="capitalize">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
