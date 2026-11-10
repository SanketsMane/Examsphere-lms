// Creates the files notes-e2e.sh uploads: a 12-page PDF, a cover PNG and a fake PDF.
// usage: node scripts/e2e/make-fixtures.mjs [dir]   (default /tmp/examsphere-e2e)
import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import sharp from "sharp";

const dir = process.argv[2] || process.env.FIXTURES || "/tmp/examsphere-e2e";
mkdirSync(dir, { recursive: true });

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (let i = 1; i <= 12; i++) {
  const page = doc.addPage([595, 842]);
  page.drawText(`NEET Biology - Cell Structure - Page ${i}`, { x: 60, y: 760, size: 18, font, color: rgb(0.1, 0.1, 0.4) });
  page.drawText("Mitochondria is the powerhouse of the cell.", { x: 60, y: 720, size: 12, font });
}
writeFileSync(`${dir}/test-notes.pdf`, await doc.save());
await sharp({ create: { width: 600, height: 800, channels: 3, background: { r: 30, g: 60, b: 120 } } })
  .png()
  .toFile(`${dir}/test-cover.png`);
writeFileSync(`${dir}/not-a-pdf.pdf`, "hello, I am not a pdf");
console.log(`fixtures written to ${dir}`);
