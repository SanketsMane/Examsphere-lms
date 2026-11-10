"use client";

import { useCallback, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PdfViewerClient } from "@/components/notes/PdfViewerClient";

interface Props {
  noteId: string;
  initialPage: number;
  canDownload: boolean;
  allowDownload: boolean;
  downloadsLeft: number | null;
  trackProgress: boolean;
  overlayText: string;
}

export function NoteReader({ noteId, initialPage, canDownload, allowDownload, downloadsLeft, trackProgress, overlayText }: Props) {
  const [left, setLeft] = useState(downloadsLeft);
  const [downloading, setDownloading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save the page a moment after the reader stops flipping, not on every page turn.
  const onPageChange = useCallback(
    (page: number) => {
      if (!trackProgress) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fetch(`/api/notes/${noteId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page }),
          keepalive: true,
        }).catch(() => {});
      }, 1500);
    },
    [noteId, trackProgress]
  );

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") || "")?.[1] || "notes.pdf";
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href: url, download: name });
      a.click();
      URL.revokeObjectURL(url);
      if (left !== null) setLeft(Math.max(0, left - 1));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      {allowDownload && (
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
          {left !== null && <span>{left} download{left === 1 ? "" : "s"} left</span>}
          <Button variant="outline" size="sm" onClick={download} disabled={downloading || !canDownload || left === 0}>
            {downloading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
            Download PDF
          </Button>
        </div>
      )}
      <PdfViewerClient url={`/api/notes/${noteId}/read`} initialPage={initialPage} onPageChange={onPageChange} overlayText={overlayText} />
      <p className="text-center text-xs text-muted-foreground">
        This copy is licensed to you and marked with your account details. Please don&apos;t share it.
      </p>
    </div>
  );
}
