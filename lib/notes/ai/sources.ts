import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { inspectPdf, NotePdfError } from "@/lib/notes/pdf";

/** Validating and preparing uploaded source material (photos, screenshots, PDFs) for the AI. */

export const MAX_SOURCE_FILES = 30;
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // per file
export const MAX_SOURCE_PAGES = 200; // per job, across all files
const PDF_CHUNK_PAGES = 6;

export class SourceError extends Error {}

export interface CheckedSource {
  kind: "PDF" | "IMAGE";
  mimeType: string;
  ext: string;
  pageCount: number;
  sha256: string;
  bytes: Buffer;
}

/** Identify by content, not by the browser-declared type or the file name. */
export async function checkSourceFile(bytes: Buffer, name: string): Promise<CheckedSource> {
  if (bytes.length === 0) throw new SourceError(`${name}: the file is empty.`);
  if (bytes.length > MAX_SOURCE_BYTES) throw new SourceError(`${name}: larger than ${MAX_SOURCE_BYTES / 1024 / 1024} MB.`);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (bytes.subarray(0, 1024).toString("latin1").includes("%PDF-")) {
    try {
      const info = await inspectPdf(bytes);
      return { kind: "PDF", mimeType: "application/pdf", ext: "pdf", pageCount: info.pageCount, sha256, bytes };
    } catch (e) {
      throw new SourceError(`${name}: ${e instanceof NotePdfError ? e.message : "could not read this PDF."}`);
    }
  }

  let meta;
  try {
    meta = await sharp(bytes, { limitInputPixels: 80_000_000 }).metadata();
  } catch {
    throw new SourceError(`${name}: not a supported image or PDF. Use JPEG, PNG, WebP or PDF (export iPhone HEIC photos as JPEG).`);
  }
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) {
    throw new SourceError(`${name}: ${meta.format ?? "this"} images aren't supported. Use JPEG, PNG or WebP.`);
  }
  const ext = meta.format === "jpeg" ? "jpg" : meta.format;
  return { kind: "IMAGE", mimeType: `image/${meta.format}`, ext, pageCount: 1, sha256, bytes };
}

export interface AiUnit {
  kind: "pdf" | "image";
  base64: string;
  mediaType: string;
  firstPage: number; // 1-based within the source
  pageCount: number;
}

/** Split a source into model-sized units: one image, or up to 6 PDF pages each. */
export async function sourceUnits(kind: "PDF" | "IMAGE", bytes: Buffer): Promise<AiUnit[]> {
  if (kind === "IMAGE") {
    // Upright, at most 2000px on the long side, JPEG: readable and a sensible token cost.
    const jpeg = await sharp(bytes, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return [{ kind: "image", base64: jpeg.toString("base64"), mediaType: "image/jpeg", firstPage: 1, pageCount: 1 }];
  }

  const src = await PDFDocument.load(bytes, { updateMetadata: false });
  const total = src.getPageCount();
  const units: AiUnit[] = [];
  for (let start = 0; start < total; start += PDF_CHUNK_PAGES) {
    const count = Math.min(PDF_CHUNK_PAGES, total - start);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, Array.from({ length: count }, (_, i) => start + i));
    pages.forEach((p) => out.addPage(p));
    units.push({ kind: "pdf", base64: Buffer.from(await out.save()).toString("base64"), mediaType: "application/pdf", firstPage: start + 1, pageCount: count });
  }
  return units;
}
