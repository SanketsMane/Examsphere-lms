"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useRazorpay } from "@/components/payment/use-razorpay";
import { withCallbackUrl } from "@/lib/callback-url";
import { buyNoteWithWalletAction } from "@/app/(public)/notes/actions";

export type NoteBuyState = "owned" | "free" | "buy" | "course_only" | "revoked";

export interface NoteBuyPanelProps {
  note: { id: string; slug: string; title: string; effectivePricePaise: number; pricePaise: number };
  state: NoteBuyState;
  signedIn: boolean;
  courses: { title: string; slug: string }[];
}

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function NoteBuyPanel({ note, state, signedIn, courses }: NoteBuyPanelProps) {
  const router = useRouter();
  const { openCheckout } = useRazorpay();
  const [busy, setBusy] = useState<"razorpay" | "wallet" | "claim" | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [, startTransition] = useTransition();
  const readerHref = `/dashboard/notes/${note.slug}`;
  const loginHref = withCallbackUrl("/login", `/notes/${note.slug}`);

  const goToReader = () => startTransition(() => router.push(readerHref));

  async function claim() {
    setBusy("claim");
    try {
      const res = await fetch(`/api/notes/${note.id}/claim`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not add these notes");
      toast.success("Added to My Notes");
      goToReader();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function payWithRazorpay() {
    setBusy("razorpay");
    try {
      const res = await fetch("/api/notes/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note.id }),
      });
      const order = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push(loginHref);
        return;
      }
      if (!res.ok) throw new Error(order.error || "Could not start the payment");

      await openCheckout({
        orderId: order.orderId,
        keyId: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ExamSphere",
        description: order.name,
        user: order.user,
        onSuccess: async (_paymentId, response) => {
          const verify = await fetch("/api/notes/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          }).catch(() => null);
          if (verify?.ok) {
            toast.success("Payment successful. Opening your notes…");
            goToReader();
          } else {
            // The webhook grants access too; it may just be a little behind.
            toast.info("Payment received. Your notes will appear in My Notes in a moment.");
            startTransition(() => router.push("/dashboard/notes"));
          }
        },
        onError: () => toast.error("Payment failed or was cancelled."),
      });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function payWithWallet() {
    setBusy("wallet");
    try {
      const result = await buyNoteWithWalletAction(note.id);
      if (result.status !== "success") throw new Error(result.message || "Purchase failed");
      toast.success("Notes unlocked!");
      goToReader();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
      setWalletOpen(false);
    }
  }

  if (state === "owned") {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={readerHref}>
          <BookOpen className="mr-2 size-4" /> Read now
        </Link>
      </Button>
    );
  }

  if (state === "revoked") {
    return <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">Access to these notes was removed. Please contact support.</p>;
  }

  if (state === "course_only") {
    return (
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium"><Lock className="size-4" /> Included with {courses.length === 1 ? "this course" : "these courses"}:</p>
        <ul className="space-y-2">
          {courses.map((c) => (
            <li key={c.slug}>
              <Link href={`/courses/${c.slug}`} className="block rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary">
                {c.title}
              </Link>
            </li>
          ))}
        </ul>
        {!signedIn && (
          <p className="text-xs text-muted-foreground">
            Already enrolled? <Link className="font-medium text-primary underline" href={loginHref}>Sign in</Link> to read.
          </p>
        )}
      </div>
    );
  }

  if (state === "free") {
    return signedIn ? (
      <Button size="lg" className="w-full" onClick={claim} disabled={busy !== null}>
        {busy === "claim" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <BookOpen className="mr-2 size-4" />}
        Get free notes
      </Button>
    ) : (
      <Button asChild size="lg" className="w-full">
        <Link href={loginHref}>Sign in to read for free</Link>
      </Button>
    );
  }

  // state === "buy"
  if (!signedIn) {
    return (
      <Button asChild size="lg" className="w-full">
        <Link href={loginHref}>Sign in to buy · {rupees(note.effectivePricePaise)}</Link>
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" onClick={payWithRazorpay} disabled={busy !== null}>
        {busy === "razorpay" && <Loader2 className="mr-2 size-4 animate-spin" />}
        Buy now · {rupees(note.effectivePricePaise)}
      </Button>
      <Button variant="outline" size="lg" className="w-full" onClick={() => setWalletOpen(true)} disabled={busy !== null}>
        <Wallet className="mr-2 size-4" /> Pay from wallet
      </Button>
      {courses.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Also included with {courses.map((c, i) => (
            <span key={c.slug}>{i > 0 && ", "}<Link className="font-medium text-primary hover:underline" href={`/courses/${c.slug}`}>{c.title}</Link></span>
          ))}.
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Secure payment via Razorpay. Instant access after payment.
      </p>

      <AlertDialog open={walletOpen} onOpenChange={setWalletOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay {rupees(note.effectivePricePaise)} from your wallet?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{note.title}&rdquo; will be added to My Notes straight away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "wallet"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                payWithWallet();
              }}
              disabled={busy === "wallet"}
            >
              {busy === "wallet" && <Loader2 className="mr-2 size-4 animate-spin" />}
              Pay {rupees(note.effectivePricePaise)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
