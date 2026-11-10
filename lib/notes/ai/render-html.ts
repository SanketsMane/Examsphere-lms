import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";
import katex from "katex";
import DOMPurify from "isomorphic-dompurify";
import type { NoteBlock, NoteDoc, RenderStyle } from "@/lib/notes/ai/doc-schema";

/**
 * NoteDoc -> a self-contained HTML document styled as handwritten notes. Used for the admin
 * preview and, through headless Chromium, for the PDF. Everything (fonts, KaTeX CSS) is inlined
 * so rendering needs no network access; every piece of text is escaped and every SVG sanitised.
 */

const nm = (...p: string[]) => path.join(process.cwd(), "node_modules", ...p);

let assetCss: string | null = null;
function assets(): string {
  if (assetCss) return assetCss;
  const font = (file: string) => `url(data:font/woff2;base64,${readFileSync(file).toString("base64")}) format("woff2")`;
  const kalam = (sub: string, w: number) => nm("@fontsource", "kalam", "files", `kalam-${sub}-${w}-normal.woff2`);
  const caveat = (w: number) => nm("@fontsource", "caveat", "files", `caveat-latin-${w}-normal.woff2`);
  const deva = "unicode-range: U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF;";
  const faces = [
    `@font-face{font-family:Kalam;font-weight:400;src:${font(kalam("latin", 400))};}`,
    `@font-face{font-family:Kalam;font-weight:700;src:${font(kalam("latin", 700))};}`,
    `@font-face{font-family:Kalam;font-weight:400;src:${font(kalam("devanagari", 400))};${deva}}`,
    `@font-face{font-family:Kalam;font-weight:700;src:${font(kalam("devanagari", 700))};${deva}}`,
    `@font-face{font-family:Caveat;font-weight:600;src:${font(caveat(600))};}`,
    `@font-face{font-family:Caveat;font-weight:700;src:${font(caveat(700))};}`,
  ].join("\n");

  // KaTeX CSS with its fonts inlined (woff2 only).
  const katexDir = nm("katex", "dist");
  const katexCss = readFileSync(path.join(katexDir, "katex.min.css"), "utf8").replace(
    /src:url\(fonts\/([^)]+?\.woff2)\) format\("woff2"\)(,url\([^)]+\) format\("[^"]+"\))*/g,
    (_m, file: string) => `src:${font(path.join(katexDir, "fonts", file))}`
  );
  assetCss = `${faces}\n${katexCss}`;
  return assetCss;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function math(latex: string, display: boolean): string {
  return katex.renderToString(latex, {
    displayMode: display,
    throwOnError: false,
    trust: false,
    strict: "ignore",
    output: "html",
    maxSize: 20,
    maxExpand: 500,
  });
}

/** Escape, then apply $inline maths$, **bold** and ==highlight==. */
export function inline(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .split(/(\$[^$\n]{1,400}\$)/g)
    .map((part) => {
      if (/^\$[^$]+\$$/.test(part)) return math(part.slice(1, -1), false);
      return esc(part)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/==(.+?)==/g, '<mark class="hl">$1</mark>')
        .replace(/\n/g, "<br>");
    })
    .join("");
}

let svgHookInstalled = false;
function installSvgHook() {
  if (svgHookInstalled) return;
  svgHookInstalled = true;
  // Paint attributes may reference gradients in the same SVG (url(#id)); anything else
  // (url(http://...), url(data:...)) is dropped so the SVG can never point outside itself.
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (/url\s*\(/i.test(data.attrValue) && !/^\s*url\(\s*['"]?#[\w-]+['"]?\s*\)\s*$/i.test(data.attrValue)) {
      if (data.attrName === "fill" || data.attrName === "stroke") data.attrValue = "none"; // not black
      else data.keepAttr = false;
    }
  });
}

export function sanitizeSvg(svg: string | null | undefined): string {
  if (!svg || !/<svg[\s>]/i.test(svg)) return "";
  installSvgHook();
  const clean = DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: false },
    FORBID_TAGS: ["foreignObject", "image", "use", "script", "style", "a", "animate", "set"],
    FORBID_ATTR: ["href", "xlink:href", "style"],
  });
  if (!/^\s*<svg[\s>]/i.test(clean)) return "";
  // Scale to the column width.
  return clean.replace(/^\s*<svg/i, '<svg class="dg" preserveAspectRatio="xMidYMid meet"');
}

const CALLOUT_LABEL: Record<string, string> = {
  tip: "Tip",
  exam: "Exam point",
  mistake: "Common mistake",
  mnemonic: "Mnemonic",
  remember: "Remember",
};

function block(b: NoteBlock): string {
  switch (b.type) {
    case "paragraph":
      return `<p class="b">${inline(b.text)}</p>`;
    case "bullets":
      return `<ul class="b list">${(b.items ?? []).map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`;
    case "numbered":
      return `<ol class="b list">${(b.items ?? []).map((i) => `<li>${inline(i)}</li>`).join("")}</ol>`;
    case "definition":
      return `<div class="b def keep"><span class="term">${inline(b.term)}</span><span class="dash"> : </span>${inline(b.text)}</div>`;
    case "formula":
      return `<div class="b formula keep"><div class="fbox">${math(b.latex ?? "", true)}</div>${b.caption ? `<div class="cap">${inline(b.caption)}</div>` : ""}</div>`;
    case "table": {
      const head = (b.headers ?? []).map((h) => `<th>${inline(h)}</th>`).join("");
      const rows = (b.rows ?? []).map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      return `<div class="b keep"><table class="tbl">${head ? `<thead><tr>${head}</tr></thead>` : ""}<tbody>${rows}</tbody></table>${b.caption ? `<div class="cap">${inline(b.caption)}</div>` : ""}</div>`;
    }
    case "diagram": {
      const svg = sanitizeSvg(b.svg);
      if (!svg) return "";
      return `<figure class="b diagram keep">${svg}${b.caption ? `<figcaption class="cap">${inline(b.caption)}</figcaption>` : ""}</figure>`;
    }
    case "callout": {
      const v = b.variant ?? "tip";
      return `<aside class="b callout keep v-${v}"><span class="clabel">${CALLOUT_LABEL[v] ?? "Note"}</span>${inline(b.text)}</aside>`;
    }
    case "qa":
      return `<div class="b qa keep"><div class="q"><span class="qm">Q.</span> ${inline(b.question)}</div><div class="a"><span class="qm">A.</span> ${inline(b.answer)}</div></div>`;
    default:
      return "";
  }
}

const STYLES: Record<RenderStyle["style"], string> = {
  notebook: `--ink:#1e3a8a;--head:#1e3a8a;--accent:#dc2626;--term:#1d4ed8;--hl:#fde68a;--body-font:Kalam,cursive;--head-font:Caveat,Kalam,cursive;--tilt:-0.25deg;`,
  topper: `--ink:#1e293b;--head:#dc2626;--accent:#15803d;--term:#7c3aed;--hl:#fde68a;--body-font:Kalam,cursive;--head-font:Caveat,Kalam,cursive;--tilt:-0.45deg;`,
  clean: `--ink:#0f172a;--head:#0b3b8c;--accent:#0b3b8c;--term:#0b3b8c;--hl:#fef08a;--body-font:"Segoe UI",Roboto,"Noto Sans","Noto Sans Devanagari",Arial,sans-serif;--head-font:"Segoe UI",Roboto,"Noto Sans",Arial,sans-serif;--tilt:0deg;`,
};

const PAPER: Record<RenderStyle["paper"], string> = {
  ruled: `background-color:#fffdf7;background-image:linear-gradient(90deg,transparent 22mm,rgba(239,68,68,.45) 22mm,rgba(239,68,68,.45) calc(22mm + 1.3px),transparent calc(22mm + 1.3px)),repeating-linear-gradient(to bottom,transparent 0,transparent 8.5mm,rgba(59,130,246,.22) 8.5mm,rgba(59,130,246,.22) calc(8.5mm + 1px));`,
  grid: `background-color:#fffefb;background-image:linear-gradient(rgba(59,130,246,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.13) 1px,transparent 1px);background-size:5mm 5mm;`,
  plain: `background-color:#ffffff;`,
};

export interface RenderMeta {
  program?: string | null;
  subject?: string | null;
  language?: string | null;
}

export function renderNoteHtml(doc: NoteDoc, style: RenderStyle, meta: RenderMeta = {}): string {
  const tags = [meta.program, meta.subject].filter(Boolean).map((t) => `<span class="tag">${esc(String(t))}</span>`).join("");
  const sections = doc.sections
    .map((s, i) => `<section class="sec${i % 2 ? " odd" : ""}"><h2>${inline(s.heading)}</h2>${s.blocks.map(block).join("")}</section>`)
    .join("");
  const lang = meta.language === "Hindi" ? "hi" : "en";

  // CSP: nothing may load from the network (fonts and images are inlined data: URLs), so a
  // hostile SVG or formula can't make the admin's browser or the server's Chromium fetch anything.
  const csp = "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:";
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><title>${esc(doc.title)}</title><style>
${assets()}
@page{size:A4;margin:14mm 0 16mm 0}
*{box-sizing:border-box}
html{${PAPER[style.paper]}-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{${STYLES[style.style]}margin:0;padding:6mm 16mm 6mm 28mm;color:var(--ink);font-family:var(--body-font);font-size:15.5px;line-height:1.6}
.head{margin-bottom:6mm}
.brand{font-family:var(--head-font);font-size:16px;color:var(--accent);letter-spacing:.5px}
h1{font-family:var(--head-font);font-size:42px;line-height:1.1;margin:2mm 0 1mm;color:var(--head);transform:rotate(var(--tilt))}
.sub{font-size:17px;opacity:.85}
.tag{display:inline-block;border:1.5px solid var(--accent);color:var(--accent);border-radius:999px;padding:0 10px;margin:3mm 6px 0 0;font-size:13px}
h2{font-family:var(--head-font);font-size:31px;line-height:1.15;color:var(--head);margin:7mm 0 3mm;break-after:avoid;page-break-after:avoid;display:inline-block;background:linear-gradient(transparent 62%,rgba(253,230,138,.75) 62%);padding:0 6px 0 2px}
.style-topper .sec.odd h2{color:var(--accent)}
.sec{break-inside:auto}
.b{margin:0 0 3.2mm}
.keep{break-inside:avoid;page-break-inside:avoid}
.list{padding-left:7mm}
.list li{margin:0 0 1.2mm}
ul.list{list-style:none}
ul.list li{position:relative}
ul.list li::before{content:"";position:absolute;left:-5.5mm;top:.62em;width:7px;height:7px;border:2px solid var(--accent);border-radius:50%}
strong{color:var(--term);font-weight:700}
mark.hl{background:linear-gradient(100deg,transparent 2%,var(--hl) 6%,var(--hl) 94%,transparent 98%);color:inherit;padding:0 3px;border-radius:3px}
.def .term{font-weight:700;color:var(--term);text-decoration:underline wavy rgba(220,38,38,.55);text-underline-offset:4px}
.formula{text-align:center}
.fbox{display:inline-block;border:2px solid var(--ink);border-radius:6px 10px 7px 9px;padding:2.5mm 6mm;transform:rotate(var(--tilt));background:rgba(255,255,255,.55)}
.formula .katex-display{margin:0}
.cap{font-size:13.5px;opacity:.8;text-align:center;margin-top:1.5mm;font-style:italic}
.tbl{border-collapse:collapse;margin:0 auto;min-width:60%;background:rgba(255,255,255,.55)}
.tbl th,.tbl td{border:1.6px solid var(--ink);padding:1.5mm 3mm;text-align:left;vertical-align:top}
.tbl th{font-family:var(--head-font);font-size:19px;color:var(--head)}
.diagram{text-align:center;margin:2mm auto 4mm}
.diagram svg.dg{width:100%;max-width:150mm;height:auto;max-height:110mm}
.callout{position:relative;border-radius:4px;padding:3mm 4mm 3mm 4mm;box-shadow:0 2px 0 rgba(0,0,0,.08);transform:rotate(var(--tilt))}
.callout .clabel{display:block;font-family:var(--head-font);font-weight:700;font-size:20px;line-height:1;margin-bottom:1mm}
.v-tip{background:#ecfdf5;border-left:5px solid #16a34a}.v-tip .clabel{color:#15803d}
.v-exam{background:#fef2f2;border-left:5px solid #dc2626}.v-exam .clabel{color:#b91c1c}
.v-mistake{background:#fff7ed;border-left:5px solid #ea580c}.v-mistake .clabel{color:#c2410c}
.v-mnemonic{background:#f5f3ff;border-left:5px solid #7c3aed}.v-mnemonic .clabel{color:#6d28d9}
.v-remember{background:#fefce8;border-left:5px solid #ca8a04}.v-remember .clabel{color:#a16207}
.qa{border-left:2px dashed rgba(30,58,138,.35);padding-left:4mm}
.qa .qm{font-weight:700;color:var(--accent)}
.qa .a{margin-top:1mm}
.style-clean h2{background:none;border-bottom:2px solid #e2e8f0;padding:0 0 1mm;display:block;font-weight:700;font-size:24px}
.style-clean h1{font-weight:800;font-size:34px}
.style-clean .callout,.style-clean .fbox,.style-clean h1{transform:none}
.style-clean{font-size:14px;line-height:1.55}
</style></head><body class="style-${style.style} paper-${style.paper}">
<header class="head"><div class="brand">ExamSphere Notes</div><h1>${inline(doc.title)}</h1>${doc.subtitle ? `<div class="sub">${inline(doc.subtitle)}</div>` : ""}${tags ? `<div>${tags}</div>` : ""}</header>
${sections}
</body></html>`;
}
