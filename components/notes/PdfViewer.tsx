"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Bundled worker (no CDN): pdf.js parses the file off the main thread.
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export interface PdfViewerProps {
  url: string;
  initialPage?: number;
  onPageChange?: (page: number, total: number) => void;
  /** Shown over every page (the PDF itself is watermarked too). */
  overlayText?: string;
  className?: string;
}

/**
 * Single-page PDF reader (pdf.js). Works on Android Chrome, which cannot show PDFs inline.
 * Text and annotation layers are off: lighter, and the text isn't trivially copyable.
 * Import with next/dynamic and { ssr: false }.
 */
export default function PdfViewer({ url, initialPage = 1, onPageChange, overlayText, className }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(Math.max(1, initialPage));
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // Must be stable: a new object each render makes react-pdf reload the whole document.
  const docOptions = useMemo(() => ({ withCredentials: true }), []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      if (!numPages) return;
      const p = Math.min(numPages, Math.max(1, next));
      setPage(p);
      onPageChange?.(p, numPages);
    },
    [numPages, onPageChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(page + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const pageWidth = Math.max(240, Math.min(width, 980) * zoom);

  return (
    <div className={className}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => go(page - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-24 text-center text-sm tabular-nums text-muted-foreground">
            {numPages ? (
              <>
                Page{" "}
                <input
                  aria-label="Go to page"
                  className="w-12 rounded border border-border bg-background px-1 text-center text-foreground"
                  inputMode="numeric"
                  value={page}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/\D/g, ""));
                    if (n) go(n);
                  }}
                />{" "}
                of {numPages}
              </>
            ) : (
              "Loading…"
            )}
          </span>
          <Button variant="ghost" size="icon" aria-label="Next page" disabled={!numPages || page >= numPages} onClick={() => go(page + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom((z) => +(z - 0.2).toFixed(1))}>
            <Minus className="size-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" aria-label="Zoom in" disabled={zoom >= 2.4} onClick={() => setZoom((z) => +(z + 0.2).toFixed(1))}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={box}
        className="relative mt-3 flex select-none justify-center overflow-x-auto"
        onContextMenu={(e) => e.preventDefault()}
      >
        {error ? (
          <p className="py-20 text-center text-sm text-destructive">{error}</p>
        ) : (
          <Document
            file={url}
            options={docOptions}
            loading={
              <div className="flex items-center gap-2 py-24 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Opening notes…
              </div>
            }
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              const start = Math.min(n, Math.max(1, initialPage));
              setPage(start);
              onPageChange?.(start, n);
            }}
            onLoadError={() => setError("These notes could not be opened. Refresh the page or try again later.")}
          >
            {width > 0 && (
              <div className="relative shadow-[var(--shadow-es-md)]">
                <Page pageNumber={page} width={pageWidth} renderTextLayer={false} renderAnnotationLayer={false} />
                {overlayText && (
                  <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                    <span className="-rotate-[30deg] whitespace-nowrap text-lg font-semibold text-slate-500/15 sm:text-2xl">
                      {overlayText}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Document>
        )}
      </div>
    </div>
  );
}
