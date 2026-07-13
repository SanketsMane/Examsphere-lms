"use client";

import { ArrowRight } from "lucide-react";

interface EnquireButtonProps {
  className?: string;
  withArrow?: boolean;
  label?: string;
}

/**
 * Opens the public chatbot (which captures name / email / mobile) so students can send an
 * enquiry instead of seeing a price. Dispatches a window event the chatbot listens for.
 */
export function EnquireButton({ className, withArrow = false, label = "Enquire Now" }: EnquireButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("examsphere:open-chat"))}
      className={className}
      aria-label={`${label} — opens the enquiry chat`}
    >
      {label}
      {withArrow && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}
