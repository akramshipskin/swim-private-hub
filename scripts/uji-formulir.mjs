// Uji formulir di browser: tiap formulir yang punya isian terlihat dikirim dalam dua mode dengan pemeriksaan browser DIMATIKAN
// (noValidate), jadi yang teruji adalah penjagaan di server: "kosong" dan "panjang+karakter khusus". AKUN UJI LOKAL saja.
// Tidak mengirim formulir yang hanya berisi isian tersembunyi (mis. tombol Setujui/Tolak) atau tombol berbahaya (hapus, nonaktifkan, reset, dst).
//   node scripts/uji-formulir.mjs <config.json>   config: { base, out, username?, password?, otpCmd?, otpCwd?, pages:[...] }
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { base } = cfg;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base)) throw new Error("Hanya untuk localhost");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9500 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "form-"))}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws; for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch { /* belum siap */ } if (!ws) await sleep(200); }
await new Promise((r) => (ws.onopen = r));
let id = 0; const w = new Map(); let ls = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && w.has(d.id)) { w.get(d.id)(d); w.delete(d.id); } else ls.forEach((f) => f(d)); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; w.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
for (const d of ["Page", "Runtime", "Network"]) await send(`${d}.enable`);
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
const issues = { net: [], exc: [] };
ls.push((d) => {
  if (d.method === "Network.responseReceived" && d.params.response.status >= 500) issues.net.push(d.params.response.status + " " + d.params.response.url.replace(base, ""));
  if (d.method === "Runtime.exceptionThrown") issues.exc.push((d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 160));
});
const go = async (p) => { const done = new Promise((r) => { const f = (d) => { if (d.method === "Page.loadEventFired") { ls = ls.filter((x) => x !== f); r(); } }; ls.push(f); }); await send("Page.navigate", { url: base + p }); await Promise.race([done, sleep(20000)]); await sleep(900); };
const fill = (sel, v) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`;

if (cfg.username) {
  await go("/login");
  await ev(`${fill("#login-username", cfg.username)}; ${fill("#login-password", cfg.password)}; document.querySelector("#login-username").form.requestSubmit()`);
  let otp = false, landed = null;
  for (let i = 0; i < 60; i++) {
    await sleep(500); const p = await ev("location.pathname");
    if (p && p !== "/login") { landed = p; break; }
    if (cfg.otpCmd && !otp && (await ev(`!!document.querySelector("#login-otp")`))) {
      const { execSync } = await import("node:child_process");
      await ev(`${fill("#login-otp", execSync(cfg.otpCmd, { cwd: cfg.otpCwd }).toString().trim())}; document.querySelector("#login-otp").form.requestSubmit()`); otp = true;
    }
  }
  if (!landed) throw new Error("login gagal");
}
await go("/robots.txt"); await ev(`localStorage.setItem("cookieConsent","acknowledged")`);

const DANGER = /hapus|nonaktif|reset|setujui|tolak|batalkan|keluar|logout|cairkan|bayar|beli|tandai|hadir|konfirmasi|tarik|koreksi/i;
const LIST = `(() => [...document.forms].map((f, i) => {
  const vis = [...f.elements].filter((e) => e.name && !e.disabled && e.type !== "hidden" && e.type !== "submit" && e.type !== "button" && e.offsetParent !== null);
  const files = vis.some((e) => e.type === "file");
  const btn = [...f.querySelectorAll("button, input[type=submit]")].map((b) => (b.innerText || b.value || "").trim()).join(" | ");
  return { i, n: vis.length, files, names: vis.map((e) => e.name + ":" + (e.type || e.tagName)).slice(0, 8), btn: btn.slice(0, 80), action: (f.getAttribute("action") || "").slice(0, 40) };
}))()`;
const SUBMIT = (i, mode) => `(async () => {
  const f = document.forms[${i}]; f.noValidate = true;
  const long = "A".repeat(5000) + " <script>window.__xss=1</script> \\"'; DROP TABLE x;-- ../../etc %00 😀";
  for (const e of f.elements) {
    if (!e.name || e.disabled || e.type === "hidden" || e.type === "submit" || e.type === "button" || e.type === "file" || e.type === "checkbox" || e.type === "radio") continue;
    const proto = e.tagName === "SELECT" ? HTMLSelectElement.prototype : e.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const v = ${JSON.stringify(mode)} === "kosong" ? "" : (e.type === "number" || e.type === "date" || e.tagName === "SELECT" || e.type === "time" ? e.value : long);
    Object.getOwnPropertyDescriptor(proto, "value").set.call(e, v); e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const before = location.href; const t0 = document.body.innerText.length;
  f.requestSubmit(); await new Promise((r) => setTimeout(r, 2200));
  const alerts = [...document.querySelectorAll('[role=alert], [class*="danger"], [class*="error"]')].map((e) => e.innerText.trim()).filter(Boolean).slice(0, 3);
  return { moved: location.href !== before, alerts, xss: !!window.__xss, dtext: document.body.innerText.length - t0 };
})()`;

const results = [];
for (const page of cfg.pages) {
  await go(page);
  const forms = (await ev(LIST)) ?? [];
  for (const f of forms) {
    const skip = f.n === 0 ? "hanya isian tersembunyi" : f.files ? "ada unggah file" : DANGER.test(f.btn) ? "tombol berisiko (" + f.btn.slice(0, 30) + ")" : null;
    if (skip) { results.push({ page, form: f.i, btn: f.btn, skip }); continue; }
    for (const mode of ["kosong", "panjang+khusus"]) {
      issues.net.length = 0; issues.exc.length = 0;
      await go(page);
      const r = await ev(SUBMIT(f.i, mode)).catch((e) => ({ error: String(e) }));
      results.push({ page, form: f.i, btn: f.btn, fields: f.names.join(","), mode, ...r, net5xx: [...new Set(issues.net)], exc: [...new Set(issues.exc)].slice(0, 2) });
    }
  }
}
writeFileSync(cfg.out, JSON.stringify(results, null, 1));
console.log("selesai:", results.length, "catatan ->", cfg.out);
ws.close(); chrome.kill();
