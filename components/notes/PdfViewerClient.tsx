"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { PdfViewerProps } from "./PdfViewer";

/** pdf.js needs browser APIs, so the viewer is loaded on the client only. */
export const PdfViewerClient = dynamic<PdfViewerProps>(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading viewer…
    </div>
  ),
});
