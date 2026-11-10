import "server-only";

import { existsSync } from "node:fs";
import { chromium, type Browser } from "playwright-core";

/**
 * HTML -> PDF with headless Chromium (playwright-core; no bundled browser download).
 * Set CHROMIUM_PATH, or install Chromium/Chrome in a standard location.
 * The page runs with JavaScript disabled and every network request blocked: the HTML is built
 * from AI output, so it must not be able to execute code or reach internal services.
 */

const CANDIDATES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

export function findChromium(): string {
  const configured = process.env.CHROMIUM_PATH;
  if (configured) {
    if (!existsSync(configured)) throw new Error(`CHROMIUM_PATH does not exist: ${configured}`);
    return configured;
  }
  const found = CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("Chromium not found. Install it (apt install chromium) or set CHROMIUM_PATH.");
  return found;
}

let browserPromise: Promise<Browser> | null = null;
function browser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium
      .launch({ executablePath: findChromium(), headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] })
      .catch((e) => {
        browserPromise = null;
        throw e;
      });
  }
  return browserPromise;
}

export async function closeRenderer() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    browserPromise = null;
    await b?.close().catch(() => {});
  }
}

export async function htmlToPdf(html: string, opts: { footerLabel?: string } = {}): Promise<Buffer> {
  const b = await browser();
  const context = await b.newContext({ javaScriptEnabled: false, offline: true });
  try {
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {}); // no-op without JS; fonts are inline anyway
    const label = (opts.footerLabel ?? "ExamSphere").replace(/[<>&"]/g, "");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;font-size:8px;color:#64748b;text-align:center;font-family:Arial,sans-serif">${label} &middot; <span class="pageNumber"></span>/<span class="totalPages"></span></div>`,
    });
    return Buffer.from(pdf);
  } finally {
    await context.close().catch(() => {});
  }
}
