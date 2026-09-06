"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitContact, type ContactResult } from "./contact-action";

const field =
  "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-ink-500 dark:placeholder:text-muted-foreground outline-none focus:border-navy-900 dark:focus:border-blue-300 transition-colors";

const label = "block text-sm font-semibold text-ink-900 dark:text-foreground mb-1.5";

export function ContactForm({ programs }: { programs: { slug: string; label: string }[] }) {
  const [state, formAction, isPending] = useActionState<ContactResult | null, FormData>(
    submitContact,
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
    <form ref={formRef} action={formAction} className="space-y-4">
      {/* Honeypot (hidden from users) */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="contact-name">
            Full name <span className="text-orange-500">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Your name"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="contact-email">
            Email <span className="text-orange-500">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={field}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} htmlFor="contact-phone">
            Phone <span className="text-ink-500 dark:text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor="contact-program">
            Program of interest{" "}
            <span className="text-ink-500 dark:text-muted-foreground font-normal">(optional)</span>
          </label>
          <select id="contact-program" name="program" defaultValue="" className={field}>
            <option value="">Select a program</option>
            {programs.map((p) => (
              <option key={p.slug} value={p.label}>
                {p.label}
              </option>
            ))}
            <option value="Not sure yet">Not sure yet</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="contact-message">
          Message <span className="text-orange-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          maxLength={4000}
          placeholder="Tell us your class, target exam and what you'd like to know."
          className={`${field} resize-y min-h-[120px]`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm bg-navy-900 hover:bg-navy-950 text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Send Enquiry <Send className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-xs text-ink-500 dark:text-muted-foreground">
        We&apos;ll only use your details to respond to this enquiry.
      </p>
    </form>
  );
}
