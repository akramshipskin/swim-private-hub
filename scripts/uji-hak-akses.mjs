// Uji hak akses: setiap halaman dan route API dipanggil tanpa login dan dengan tiap peran (AKUN UJI LOKAL saja).
// Hanya membaca kode status dan arah pengalihan; route API dipanggil dengan isi kosong/tidak valid supaya tidak mengubah data.
//   node scripts/uji-hak-akses.mjs <config.json>   config: { base, out, roles:[{name,username,password,otpCmd?,otpCwd?}], pages:[...], dynamic:{...} }
// Hasil: JSON berisi matriks {rute x peran -> status/alihan}. Rute yang mengembalikan 5xx ditandai.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { base } = cfg;
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base)) throw new Error("Hanya untuk localhost");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loginCookies(role) {
  const PORT = 9100 + Math.floor(Math.random() * 400);
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "akses-"))}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  let ws; for (let i = 0; i < 150 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch { /* belum siap */ } if (!ws) await sleep(200); }
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const w = new Map(); let ls = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && w.has(d.id)) { w.get(d.id)(d); w.delete(d.id); } else ls.forEach((f) => f(d)); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; w.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable");
  const done = new Promise((r) => ls.push((d) => d.method === "Page.loadEventFired" && r()));
  await send("Page.navigate", { url: base + "/login" }); await Promise.race([done, sleep(20000)]); await sleep(1000);
  const fill = (sel, v) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`;
  await ev(`${fill("#login-username", role.username)}; ${fill("#login-password", role.password)}; document.querySelector("#login-username").form.requestSubmit()`);
  let otpUsed = false, landed = null;
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const p = await ev("location.pathname");
    if (p && p !== "/login") { landed = p; break; }
    if (role.otpCmd && !otpUsed && (await ev(`!!document.querySelector("#login-otp")`))) {
      const { execSync } = await import("node:child_process");
      const code = execSync(role.otpCmd, { cwd: role.otpCwd }).toString().trim();
      await ev(`${fill("#login-otp", code)}; document.querySelector("#login-otp").form.requestSubmit()`); otpUsed = true;
    }
  }
  const { result } = await send("Network.getAllCookies");
  ws.close(); chrome.kill();
  if (!landed) throw new Error("login gagal: " + role.name);
  return result.cookies.filter((c) => base.includes(c.domain.replace(/^\./, ""))).map((c) => `${c.name}=${c.value}`).join("; ");
}

const sessions = { "tanpa-login": "" };
for (const r of cfg.roles) { sessions[r.name] = await loginCookies(r); console.error("login", r.name, "ok"); await sleep(31000 * (r.otpCmd ? 1 : 0)); }

async function probe(method, path, cookie, body) {
  try {
    const res = await fetch(base + path, { method, redirect: "manual", headers: { cookie, ...(body !== undefined ? { "content-type": "application/json" } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
    const loc = res.headers.get("location");
    let snip = "";
    if (path.startsWith("/api/") && res.status >= 400) snip = (await res.text()).slice(0, 90).replace(/\s+/g, " ");
    return { s: res.status, loc: loc ? loc.replace(base, "").slice(0, 40) : undefined, snip: snip || undefined };
  } catch (e) { return { s: "ERR", snip: String(e).slice(0, 80) }; }
}

const out = { pages: {}, api: {} };
for (const p of cfg.pages) {
  out.pages[p] = {};
  for (const [name, cookie] of Object.entries(sessions)) out.pages[p][name] = await probe("GET", p, cookie);
}
for (const a of cfg.api) {
  const key = `${a.method} ${a.path}`;
  out.api[key] = {};
  for (const [name, cookie] of Object.entries(sessions)) out.api[key][name] = await probe(a.method, a.path, cookie, a.body);
}
writeFileSync(cfg.out, JSON.stringify(out, null, 1));
console.log("selesai ->", cfg.out);
