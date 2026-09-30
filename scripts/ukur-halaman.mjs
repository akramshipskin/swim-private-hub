// Ukur kecepatan satu halaman dengan Chrome tanpa layar (pengganti Lighthouse, tanpa paket tambahan).
// Jalankan: node scripts/ukur-halaman.mjs <url> [mobile|desktop] [jumlah-ulang=5]
//   mobile  = layar 375x812, prosesor diperlambat 4x, jaringan ±1,6 Mbps / 150 ms (mirip "4G lambat" Lighthouse)
//   desktop = layar 1280x800, tanpa pelambatan prosesor, jaringan 10 Mbps / 40 ms
// Tiap ulangan: cache dikosongkan. Laporan = nilai tengah (median) dari semua ulangan.
// Angka hanya bisa dibandingkan dengan angka dari skrip yang sama di komputer yang sama.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, profile = "mobile", runsArg = "5"] = process.argv.slice(2);
if (!url) throw new Error("Pakai: node scripts/ukur-halaman.mjs <url> [mobile|desktop] [ulang]");
const RUNS = Number(runsArg);
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9300 + Math.floor(Math.random() * 500);
const P = profile === "desktop"
  ? { w: 1280, h: 800, mobile: false, cpu: 1, down: (10 * 1024 * 1024) / 8, up: (5 * 1024 * 1024) / 8, rtt: 40 }
  : { w: 375, h: 812, mobile: true, cpu: 4, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8, rtt: 150 };

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "ukur-"))}`,
  "--no-first-run", "--disable-gpu", "--mute-audio", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return new WebSocket(page.webSocketDebuggerUrl);
    } catch { /* Chrome belum siap */ }
    await sleep(200);
  }
  throw new Error("Chrome tidak merespons");
}

const METRICS = `new Promise((resolve) => {
  const out = { lcp: null, lcpEl: null, cls: 0, tbt: 0, fcp: null };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { out.lcp = e.startTime; out.lcpEl = (e.element?.tagName || "") + ":" + (e.url || "").split("/").pop().slice(0, 40); } }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  const fcp = performance.getEntriesByName("first-contentful-paint")[0]; out.fcp = fcp ? fcp.startTime : null;
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (out.fcp !== null && e.startTime >= out.fcp) out.tbt += Math.max(0, e.duration - 50); }).observe({ type: "longtask", buffered: true });
  setTimeout(() => resolve(out), 400);
})`;

const ws = await connect();
await new Promise((r) => (ws.onopen = r));
let id = 0; const waiters = new Map(); const listeners = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waiters.has(d.id)) { waiters.get(d.id)(d); waiters.delete(d.id); } else listeners.forEach((f) => f(d)); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiters.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Page.enable"); await send("Network.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: P.w, height: P.h, deviceScaleFactor: P.mobile ? 2 : 1, mobile: P.mobile });
if (P.mobile) await send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 11; Moto G Power) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36" });

const rows = [];
for (let n = 0; n < RUNS + 1; n++) { // ulangan pertama = pemanasan server, dibuang
  await send("Network.clearBrowserCache");
  await send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await send("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await send("Page.navigate", { url: "about:blank" }); await sleep(300);
  await send("Emulation.setCPUThrottlingRate", { rate: P.cpu });
  await send("Network.emulateNetworkConditions", { offline: false, latency: P.rtt, downloadThroughput: P.down, uploadThroughput: P.up });
  let bytes = 0, reqs = 0, media = 0;
  const onMsg = (d) => {
    if (d.method === "Network.loadingFinished") { bytes += d.params.encodedDataLength; reqs++; }
    if (d.method === "Network.responseReceived" && /video|mp4|webm/.test(d.params.response.mimeType)) media++;
  };
  listeners.push(onMsg);
  const loaded = new Promise((r) => listeners.push((d) => d.method === "Page.loadEventFired" && r()));
  const t0 = Date.now();
  await send("Page.navigate", { url });
  await Promise.race([loaded, sleep(60000)]);
  const load = Date.now() - t0;
  await sleep(2500);
  const res = await send("Runtime.evaluate", { expression: METRICS, awaitPromise: true, returnByValue: true });
  listeners.splice(0, listeners.length);
  const v = res.result.result.value;
  if (n > 0) rows.push({ fcp: Math.round(v.fcp), lcp: Math.round(v.lcp), lcpEl: v.lcpEl, cls: +v.cls.toFixed(4), tbt: Math.round(v.tbt), load, kb: Math.round(bytes / 1024), req: reqs, media });
}
const med = (k) => { const a = rows.map((r) => r[k]).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
const summary = { url, profile, ulangan: RUNS, fcp_ms: med("fcp"), lcp_ms: med("lcp"), lcp_elemen: rows[0].lcpEl, cls: med("cls"), tbt_ms: med("tbt"), load_ms: med("load"), berat_kb: med("kb"), permintaan: med("req"), video: med("media") };
console.log(JSON.stringify({ ringkasan: summary, semua: rows }, null, 1));
ws.close(); chrome.kill();
