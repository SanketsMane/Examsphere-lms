/**
 * Global loading screen — minimal, professional, theme-aware.
 * Brand logo chip + wordmark + a slim indeterminate progress bar.
 */
export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex w-[200px] flex-col items-center">
        {/* Logo on a clean white chip so it reads on any theme */}
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-[0_10px_30px_-8px_rgba(10,27,61,0.35)] ring-1 ring-black/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ExamSphere" className="h-9 w-9 object-contain" />
        </div>

        {/* Wordmark */}
        <div className="font-display text-lg font-bold tracking-tight text-navy-950 dark:text-white">
          Exam<span className="text-orange-500">Sphere</span>
        </div>

        {/* Slim indeterminate progress bar */}
        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
          <div className="es-loading-bar h-full w-1/3 rounded-full bg-navy-900 dark:bg-white" />
        </div>
      </div>
    </div>
  );
}
