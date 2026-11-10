import "server-only";

import { randomBytes } from "node:crypto";
import type { NoteVersion } from "@prisma/client";
import { getPrivateStorage } from "@/lib/storage/private-storage";
import { watermarkPdf } from "@/lib/notes/pdf";

/** Where note files live in private storage. All keys are generated here. */
export const noteKeys = {
  master: (noteId: string, version: number, sha256: string) => `notes/${noteId}/v${version}/${sha256.slice(0, 16)}.pdf`,
  preview: (noteId: string, version: number) => `notes/${noteId}/v${version}/preview.pdf`,
  cover: (noteId: string, ext: string) => `notes/${noteId}/cover-${randomBytes(6).toString("hex")}.${ext}`,
  /** Per-reader watermarked copy. A new version has a new id, so old copies are never served. */
  watermarked: (versionId: string, userId: string) => `notes-cache/${versionId}/${userId}.pdf`,
};

export interface Reader {
  userId: string;
  email: string;
  /** Printed on every page; usually part of the entitlement id. */
  reference: string;
}

/** The reader's personal copy: built once, then served from the cache. */
export async function getWatermarkedPdf(version: Pick<NoteVersion, "id" | "fileKey">, reader: Reader, title?: string) {
  const storage = getPrivateStorage();
  const cacheKey = noteKeys.watermarked(version.id, reader.userId);
  if (await storage.exists(cacheKey)) return storage.get(cacheKey);

  const master = await storage.get(version.fileKey);
  const stamped = await watermarkPdf(master, { holder: reader.email, reference: reader.reference, title });
  await storage.put(cacheKey, stamped, "application/pdf");
  return stamped;
}

export function pdfResponse(bytes: Buffer, opts: { filename: string; download: boolean; cache: "private" | "public" }) {
  const safeName = opts.filename.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 100) || "notes.pdf";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.length),
      "Content-Disposition": `${opts.download ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": opts.cache === "public" ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
    },
  });
}
