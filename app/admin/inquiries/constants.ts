export const INQUIRY_STATUSES = ["new", "contacted", "qualified", "closed", "spam"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

// Tailwind badge classes per status (work in light + dark).
export const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30",
  contacted: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30",
  qualified: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30",
  closed: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30",
  spam: "bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30",
};
