"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp, ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Version {
  id: string;
  version: number;
  pageCount: number;
  fileSize: number;
  changelog: string | null;
  createdAt: string;
  isCurrent: boolean;
}

interface Props {
  noteId: string;
  coverSrc: string | null;
  versions: Version[];
  maxPdfMb: number;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function NoteFiles({ noteId, coverSrc, versions, maxPdfMb }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState<"pdf" | "cover" | null>(null);
  const [changelog, setChangelog] = useState("");
  const pdfInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function upload(kind: "pdf" | "cover", file: File) {
    if (kind === "pdf" && file.size > maxPdfMb * 1024 * 1024) {
      toast.error(`The PDF is larger than ${maxPdfMb} MB.`);
      return;
    }
    setUploading(kind);
    try {
      const body = new FormData();
      body.set(kind === "pdf" ? "file" : "cover", file);
      if (kind === "pdf" && changelog.trim()) body.set("changelog", changelog.trim());
      const res = await fetch(`/api/admin/notes/${noteId}/${kind === "pdf" ? "file" : "cover"}`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed");
      toast.success(kind === "pdf" ? `Version ${data.version} uploaded (${data.pageCount} pages)` : "Cover updated");
      setChangelog("");
      startTransition(() => router.refresh());
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
      if (pdfInput.current) pdfInput.current.value = "";
      if (coverInput.current) coverInput.current.value = "";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="space-y-3">
        <p className="text-sm font-semibold">Cover image</p>
        <div className="aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- our own resized image
            <img src={coverSrc} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
              Optional. Portrait image works best (3:4).
            </div>
          )}
        </div>
        <input
          ref={coverInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload("cover", e.target.files[0])}
        />
        <Button variant="outline" size="sm" className="w-full" disabled={uploading !== null} onClick={() => coverInput.current?.click()}>
          {uploading === "cover" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ImageUp className="mr-2 size-4" />}
          {coverSrc ? "Replace cover" : "Upload cover"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-dashed border-border p-5">
          <p className="text-sm font-semibold">{versions.length ? "Upload a new version" : "Upload the notes PDF"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF up to {maxPdfMb} MB. Students always get the latest version; earlier versions are kept for your records.
            Each reader&apos;s copy is watermarked with their email automatically.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {versions.length > 0 && (
              <Input placeholder="What changed? (optional)" value={changelog} onChange={(e) => setChangelog(e.target.value)} maxLength={300} />
            )}
            <input
              ref={pdfInput}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload("pdf", e.target.files[0])}
            />
            <Button disabled={uploading !== null} onClick={() => pdfInput.current?.click()} className="shrink-0">
              {uploading === "pdf" ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileUp className="mr-2 size-4" />}
              {uploading === "pdf" ? "Uploading…" : "Choose PDF"}
            </Button>
          </div>
        </div>

        {versions.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Version</th>
                  <th className="px-4 py-2">Pages</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Uploaded</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">
                      v{v.version} {v.isCurrent && <span className="ml-1 rounded bg-es-green-600/10 px-1.5 py-0.5 text-xs text-es-green-700 dark:text-emerald-400">live</span>}
                    </td>
                    <td className="px-4 py-2">{v.pageCount}</td>
                    <td className="px-4 py-2">{mb(v.fileSize)}</td>
                    <td className="px-4 py-2">{new Date(v.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="px-4 py-2 text-muted-foreground">{v.changelog || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
