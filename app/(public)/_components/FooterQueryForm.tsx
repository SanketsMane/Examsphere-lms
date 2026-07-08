"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitFooterQuery, type QueryResult } from "./footer-query-action";

export function FooterQueryForm() {
  const [state, formAction, isPending] = useActionState<QueryResult | null, FormData>(
    submitFooterQuery,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success(state.message);
      formRef.current?.reset();
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {/* Honeypot (hidden from users) */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <input
        type="text"
        name="name"
        required
        placeholder="Your Name"
        className="w-full bg-white/[0.06] border border-white/15 rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-orange-500 transition-colors"
      />
      <input
        type="email"
        name="email"
        required
        placeholder="Your Email"
        className="w-full bg-white/[0.06] border border-white/15 rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-orange-500 transition-colors"
      />
      <textarea
        name="message"
        required
        rows={3}
        placeholder="Your Message"
        className="w-full bg-white/[0.06] border border-white/15 rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-slate-400 outline-none focus:border-orange-500 transition-colors resize-y min-h-[80px]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
