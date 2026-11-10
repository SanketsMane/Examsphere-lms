// Drive headless Chrome over CDP in real time: load a page, wait, report console,
// failed requests, and whether the pdf.js viewer drew a canvas. Optional cookie header.
// usage: node cdp-check.mjs <wsDebuggerUrl> <pageUrl> <waitMs> [cookieHeader] [screenshotPath]
import WebSocket from "ws";
import { writeFileSync } from "node:fs";

const [ws, url, waitMs = "8000", cookie = "", shot = ""] = process.argv.slice(2);
const sock = new WebSocket(ws);
let id = 0;
const pending = new Map();
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const msg = { id: ++id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    pending.set(msg.id, res);
    sock.send(JSON.stringify(msg));
  });
const logs = [];
const failed = [];
sock.on("message", (raw) => {
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); return; }
  if (m.method === "Runtime.consoleAPICalled") logs.push(`${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300)}`);
  if (m.method === "Runtime.exceptionThrown") logs.push(`EXCEPTION: ${m.params.exceptionDetails.exception?.description?.slice(0, 300) ?? m.params.exceptionDetails.text}`);
  if (m.method === "Network.loadingFailed") failed.push(`${m.params.errorText} ${m.params.type}`);
  if (m.method === "Network.responseReceived" && m.params.response.status >= 400) failed.push(`${m.params.response.status} ${m.params.response.url.slice(0, 160)}`);
});
sock.on("open", async () => {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Runtime.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);
  const mobile = process.env.MOBILE === "1";
  await send("Emulation.setDeviceMetricsOverride", mobile ? { width: 390, height: 1400, deviceScaleFactor: 2, mobile: true } : { width: Number(process.env.WIDTH || 1280), height: Number(process.env.HEIGHT || 1800), deviceScaleFactor: 1, mobile: false }, sessionId);
  if (cookie) await send("Network.setExtraHTTPHeaders", { headers: { Cookie: cookie } }, sessionId);
  await send("Page.navigate", { url }, sessionId);
  await new Promise((r) => setTimeout(r, Number(waitMs)));
  // Optional: click a button by its visible text (e.g. a tab), then wait again.
  if (process.env.CLICK_TEXT) {
    await send("Runtime.evaluate", { expression: `[...document.querySelectorAll("button")].find(b => b.textContent.trim().startsWith(${JSON.stringify(process.env.CLICK_TEXT)}))?.click()` }, sessionId);
    await new Promise((r) => setTimeout(r, Number(process.env.CLICK_WAIT || 4000)));
  }
  const probe = await send("Runtime.evaluate", {
    expression: `JSON.stringify({ canvases: [...document.querySelectorAll('canvas')].map(c => c.width + 'x' + c.height), pageLabel: document.body.innerText.match(/Page\\s+\\d*\\s*of\\s+\\d+/)?.[0] ?? null, opening: document.body.innerText.includes('Opening notes'), errorText: document.body.innerText.match(/could not be opened|Something went wrong/)?.[0] ?? null })`,
    returnByValue: true,
  }, sessionId);
  console.log("PROBE", probe.result?.value);
  if (shot) {
    const img = await send("Page.captureScreenshot", { format: "png" }, sessionId);
    writeFileSync(shot, Buffer.from(img.data, "base64"));
    console.log("screenshot", shot);
  }
  console.log("CONSOLE", JSON.stringify(logs, null, 1));
  console.log("FAILED", JSON.stringify(failed, null, 1));
  await send("Target.closeTarget", { targetId });
  sock.close();
  process.exit(0);
});
