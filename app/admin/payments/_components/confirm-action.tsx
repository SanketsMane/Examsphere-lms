"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Review-and-confirm wrapper for irreversible money decisions.
 *
 * Approving a payout or a refund moves real money and cannot be undone from
 * this screen. Previously both fired from a single unlabelled icon button
 * inside a bare <form action>, so one stray click on the wrong table row
 * approved a withdrawal. This shows who is affected and how much, before asking
 * for a deliberate confirmation.
 */
export function ConfirmAction({
  action,
  title,
  description,
  details,
  confirmLabel,
  destructive,
  trigger,
  successMessage,
}: {
  /** Server action. Must return void or throw. */
  action: () => Promise<unknown>;
  title: string;
  description: string;
  /** Key/value review rows — recipient, amount, fees, net. */
  details?: { label: string; value: React.ReactNode }[];
  confirmLabel: string;
  destructive?: boolean;
  trigger: React.ReactNode;
  successMessage: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm(e: React.MouseEvent) {
    // Keep the dialog open while the action runs so the user sees the pending
    // state rather than a dialog that vanishes with no feedback.
    e.preventDefault();
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        setOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error && err.message
            ? err.message
            : "That didn't go through. Nothing was changed — please try again."
        );
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {details && details.length > 0 && (
          <dl className="rounded-md border bg-muted/40 divide-y text-sm">
            {details.map((d) => (
              <div key={d.label} className="flex items-start justify-between gap-4 px-3 py-2">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd className="text-right font-medium tabular-nums">{d.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              destructive && "bg-destructive text-white hover:bg-destructive/90"
            )}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Small, clearly-labelled action button. Icon-only buttons carry an aria-label. */
export function ActionButton({
  children,
  tone = "default",
  ...props
}: React.ComponentProps<typeof Button> & { tone?: "default" | "approve" | "reject" }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      {...props}
      className={cn(
        "h-8",
        tone === "approve" &&
          "border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-500/10",
        tone === "reject" &&
          "border-red-600/30 text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/10",
        props.className
      )}
    >
      {children}
    </Button>
  );
}
