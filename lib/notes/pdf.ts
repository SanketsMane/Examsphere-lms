import "server-only";

import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { MAX_NOTE_PAGES, MAX_NOTE_PDF_BYTES } from "@/lib/notes/validation";

export class NotePdfError extends Error {}

export interface InspectedPdf {
  pageCount: number;
  sha256: string;
  size: number;
}

/** Validate an uploaded PDF by its bytes (not its name or declared type). */
export async function inspectPdf(bytes: Buffer): Promise<InspectedPdf> {
  if (bytes.length === 0) throw new NotePdfError("The file is empty.");
  if (bytes.length > MAX_NOTE_PDF_BYTES) {
    throw new NotePdfError(`The PDF is larger than ${Math.round(MAX_NOTE_PDF_BYTES / 1024 / 1024)} MB.`);
  }
  // "%PDF-" may be preceded by a little junk in the wild; real files have it in the first 1 KB.
  if (!bytes.subarray(0, 1024).toString("latin1").includes("%PDF-")) {
    throw new NotePdfError("This file is not a PDF.");
  }

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err: any) {
    if (String(err?.message || "").toLowerCase().includes("encrypt")) {
      throw new NotePdfError("This PDF is password-protected. Upload an unprotected copy.");
    }
    throw new NotePdfError("This PDF could not be read. It may be damaged.");
  }

  const pageCount = doc.getPageCount();
  if (pageCount < 1) throw new NotePdfError("The PDF has no pages.");
  if (pageCount > MAX_NOTE_PAGES) throw new NotePdfError(`The PDF has more than ${MAX_NOTE_PAGES} pages.`);

  return { pageCount, sha256: createHash("sha256").update(bytes).digest("hex"), size: bytes.length };
}

/** Standard PDF fonts only cover Latin-1; keep watermark text printable ASCII. */
function asciiOnly(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
}

/** First `pages` pages, stamped as a preview. Returns null when previews are off. */
export async function buildPreviewPdf(master: Buffer, pages: number): Promise<Buffer | null> {
  if (pages <= 0) return null;
  const src = await PDFDocument.load(master, { updateMetadata: false });
  const total = src.getPageCount();
  const count = Math.min(pages, total);

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, Array.from({ length: count }, (_, i) => i));
  const font = await out.embedFont(StandardFonts.HelveticaBold);
  const small = await out.embedFont(StandardFonts.Helvetica);

  for (const page of copied) {
    out.addPage(page);
    const { width, height } = page.getSize();
    const size = Math.max(36, Math.min(width, height) / 6);
    page.drawText("PREVIEW", {
      x: width * 0.18,
      y: height * 0.35,
      size,
      font,
      color: rgb(0.85, 0.25, 0.1),
      opacity: 0.12,
      rotate: degrees(35),
    });
    page.drawText(asciiOnly(`ExamSphere preview - pages 1-${count} of ${total}`), {
      x: 24,
      y: 14,
      size: 8,
      font: small,
      color: rgb(0.4, 0.4, 0.4),
      opacity: 0.8,
    });
  }
  out.setTitle("ExamSphere notes preview");
  out.setProducer("ExamSphere");
  return Buffer.from(await out.save());
}

export interface WatermarkInfo {
  /** e.g. the buyer's email; shown on every page so a leaked copy is traceable. */
  holder: string;
  /** Short reference, e.g. part of the entitlement id. */
  reference: string;
  title?: string;
}

/** Stamp every page with the reader's identity. */
export async function watermarkPdf(master: Buffer, info: WatermarkInfo): Promise<Buffer> {
  const doc = await PDFDocument.load(master, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const holder = asciiOnly(info.holder) || "ExamSphere student";
  const reference = asciiOnly(info.reference);
  const diagonal = `${holder}  -  ${reference}`;
  const footer = asciiOnly(`Licensed to ${holder} - ref ${reference} - examsphere.online - do not share`);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(10, Math.min(width, height) / 28);
    // Three faint diagonal bands so cropping one out still leaves the others.
    for (const fy of [0.2, 0.5, 0.8]) {
      page.drawText(diagonal, {
        x: width * 0.12,
        y: height * fy,
        size,
        font,
        color: rgb(0.3, 0.3, 0.5),
        opacity: 0.09,
        rotate: degrees(30),
      });
    }
    page.drawText(footer, { x: 24, y: 10, size: 7, font, color: rgb(0.35, 0.35, 0.35), opacity: 0.75 });
  }

  doc.setTitle(info.title ? asciiOnly(info.title) || "ExamSphere notes" : "ExamSphere notes");
  doc.setProducer("ExamSphere");
  doc.setSubject(`Licensed to ${holder} (${reference})`);
  return Buffer.from(await doc.save());
}
