// Mesin sweeping tampilan: login sekali per peran (AKUN UJI LOKAL saja), kunjungi daftar halaman di beberapa lebar
// layar dan tema, simpan tangkapan layar + temuan otomatis (JSONL). Tidak mengubah data.
//   node scripts/sweep-halaman.mjs <config.json>
// config: { base, out, username, password, widths:[375,768,1280], themes:["light","dark"], pages:["/x", ...], reduce:true }
// Login dilewati bila username kosong (halaman publik). Hanya dipakai ke localhost atau situs uji.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cfg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { base, out, username, password } = cfg;
const widths = cfg.widths ?? [375, 768, 1280];
const themes = cfg.themes ?? ["light"];
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base) && !cfg.allowRemote) throw new Error("Hanya untuk localhost (set allowRemote bila sengaja)");
mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "sweep-"))}`, "--no-first-run", "--disable-gpu", "--mute-audio", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page"); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch { /* belum siap */ } if (!ws) await sleep(200); }
await new Promise((r) => (ws.onopen = r));
let id = 0; const waiters = new Map(); let listeners = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && waiters.has(d.id)) { waiters.get(d.id)(d); waiters.delete(d.id); } else listeners.forEach((f) => f(d)); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiters.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJs = async (expression) => { const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
for (const d of ["Page", "Runtime", "Network", "Log"]) await send(`${d}.enable`);

const AUDIT = `(async () => {
  const vw = innerWidth, vh = innerHeight;
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (c) => { cx.clearRect(0,0,1,1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0,0,1,1); const d = cx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2],d[3]/255]; };
  const lum = ([r,g,b]) => { const f = (v) => { v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const ratio = (a,b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); };
  const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(e); return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05; };
  const desc = (e) => { const t = (e.innerText || e.getAttribute("aria-label") || e.value || "").trim().replace(/\\s+/g," ").slice(0,40); return e.tagName.toLowerCase() + (e.id ? "#"+e.id : "") + (typeof e.className === "string" && e.className ? "." + e.className.split(/\\s+/).slice(0,2).join(".") : "") + (t ? ' "'+t+'"' : ""); };
  const inScroller = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { const r = p.getBoundingClientRect(); if (r.right <= vw + 2) return true; } } return false; };
  const all = [...document.querySelectorAll("body *")].filter(vis);
  const o = { url: location.pathname + location.search, title: document.title, h1: [...document.querySelectorAll("h1")].map((e) => e.innerText.trim()).slice(0,3), vw, scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight };
  o.overflowX = o.scrollW > vw + 1;
  o.sticking = all.filter((e) => e.getBoundingClientRect().right > vw + 2 && !inScroller(e)).slice(0,6).map(desc);
  o.brokenImg = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc.slice(-60));
  o.noAltImg = [...document.images].filter((i) => !i.hasAttribute("alt")).length;
  const inter = all.filter((e) => e.matches('button, input:not([type=hidden]), select, textarea, summary, [role=button], a[href]'));
  o.smallTap = vw <= 768 ? inter.filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); if (e.tagName === "A" && cs.display === "inline") return false; return Math.min(r.width, r.height) < 40 && !(e.tagName === "INPUT" && (e.type === "checkbox" || e.type === "radio")); }).slice(0,8).map((e) => { const r = e.getBoundingClientRect(); return desc(e) + " " + Math.round(r.width) + "x" + Math.round(r.height); }) : [];
  o.noName = inter.filter((e) => e.matches("button, [role=button], a[href]") && !(e.innerText||"").trim() && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby") && !e.title && !e.querySelector("img[alt]:not([alt=''])")).slice(0,6).map(desc);
  o.noLabel = all.filter((e) => e.matches("input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea")).filter((e) => !(e.id && document.querySelector('label[for="'+CSS.escape(e.id)+'"]')) && !e.closest("label") && !e.getAttribute("aria-label") && !e.getAttribute("aria-labelledby") && !e.title).slice(0,6).map(desc);
  o.deadLinks = all.filter((e) => e.tagName === "A" && (!e.getAttribute("href") || e.getAttribute("href") === "#")).slice(0,6).map(desc);
  const small = []; const low = [];
  for (const e of all) {
    const own = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own.length) continue;
    const cs = getComputedStyle(e); const fs = parseFloat(cs.fontSize);
    if (fs < 12) small.push(desc(e) + " " + fs + "px");
    let fg = rgba(cs.color);
    let bg = null;
    for (let p = e; p; p = p.parentElement) { const s = getComputedStyle(p); if (s.backgroundImage !== "none") { bg = "img"; break; } const c = rgba(s.backgroundColor); if (c[3] > 0.95) { bg = c; break; } if (c[3] > 0) { bg = "alpha"; } }
    if (bg && bg !== "img" && bg !== "alpha") {
      if (fg[3] < 1) fg = fg.slice(0,3).map((v,i) => Math.round(v*fg[3] + bg[i]*(1-fg[3])));
      const big = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
      const need = big ? 3 : 4.5; const r = ratio(fg, bg);
      if (r < need) low.push({ r: +r.toFixed(2), need, e: desc(e), fs });
    }
  }
  o.smallText = small.slice(0,8); o.smallTextCount = small.length;
  low.sort((a,b) => a.r - b.r); o.lowContrast = low.slice(0,8); o.lowContrastCount = low.length;
  // Gaya untuk cek konsistensi antar halaman (dibandingkan nanti per peran dan lebar layar).
  const st = (e, props) => { if (!e) return null; const cs = getComputedStyle(e); return Object.fromEntries(props.map((p) => [p, cs[p]])); };
  const h1 = document.querySelector("main h1, h1");
  const main = document.querySelector("main");
  const box = main ? [...main.querySelectorAll(":scope > div, :scope > section, :scope > *")].find((e) => e.getBoundingClientRect().width > 200) : null;
  const card = [...document.querySelectorAll("main [class*='rounded-2xl'], main [class*='rounded-3xl'], main [class*='rounded-xl']")].find((e) => getComputedStyle(e).borderTopWidth !== "0px" || getComputedStyle(e).boxShadow !== "none");
  const btn = [...document.querySelectorAll("main button, main a")].find((e) => /bg-brand-600|bg-fixed-lime|bg-fixed-ink/.test(String(e.className)) && e.getBoundingClientRect().width > 40);
  o.gaya = {
    h1: st(h1, ["fontSize", "fontWeight", "fontFamily", "letterSpacing", "lineHeight"]),
    mainPadL: main ? getComputedStyle(main).paddingLeft : null,
    boxLeft: box ? Math.round(box.getBoundingClientRect().left) : null,
    boxWidth: box ? Math.round(box.getBoundingClientRect().width) : null,
    card: st(card, ["borderTopLeftRadius", "boxShadow", "borderTopWidth"]),
    btn: btn ? { ...st(btn, ["borderTopLeftRadius", "fontSize", "fontWeight"]), h: Math.round(btn.getBoundingClientRect().height) } : null,
  };
  o.bodyText = document.body.innerText.slice(0, 6000);
  return o;
})()`;

const consoleIssues = []; const netIssues = [];
listeners.push((d) => {
  if (d.method === "Runtime.exceptionThrown") consoleIssues.push("exception: " + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 200));
  if (d.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(d.params.type)) consoleIssues.push(d.params.type + ": " + d.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  if (d.method === "Log.entryAdded" && ["error"].includes(d.params.entry.level)) consoleIssues.push("log: " + d.params.entry.text.slice(0, 160) + " " + (d.params.entry.url || ""));
  if (d.method === "Network.responseReceived" && d.params.response.status >= 400) netIssues.push(d.params.response.status + " " + d.params.response.url.replace(base, ""));
  if (d.method === "Network.loadingFailed" && !d.params.canceled) netIssues.push("gagal " + (d.params.errorText || "") + " " + (d.params.requestId));
});

async function goto(path) {
  const loaded = new Promise((r) => { const f = (d) => { if (d.method === "Page.loadEventFired") { listeners = listeners.filter((x) => x !== f); r(); } }; listeners.push(f); });
  await send("Page.navigate", { url: base + path });
  await Promise.race([loaded, sleep(25000)]);
  await sleep(cfg.settle ?? 1200);
}

if (username) {
  await goto("/login");
  const fill = (sel, v) => `(() => { const set = (el, val) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, val); el.dispatchEvent(new Event("input", { bubbles: true })); }; const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; set(el, ${JSON.stringify(v)}); return true; })()`;
  const ok = await evalJs(`(() => { const u = document.querySelector("#login-username"); if (!u) return false; ${fill("#login-username", username)}; ${fill("#login-password", password)}; u.form.requestSubmit(); return true; })()`);
  let landed = null; let otpUsed = false;
  for (let i = 0; i < 60 && !landed; i++) {
    await sleep(500);
    const p = await evalJs("location.pathname");
    if (p && p !== "/login") { landed = p; break; }
    // Akun ber-2FA: kolom kode muncul setelah password diterima. Kode dari perintah lokal (cfg.otpCmd), hanya localhost.
    if (cfg.otpCmd && !otpUsed && (await evalJs(`!!document.querySelector("#login-otp")`))) {
      const { execSync } = await import("node:child_process");
      const code = execSync(cfg.otpCmd, { cwd: cfg.otpCwd }).toString().trim();
      await evalJs(`(() => { ${fill("#login-otp", code)}; document.querySelector("#login-otp").form.requestSubmit(); })()`);
      otpUsed = true;
    }
  }
  writeFileSync(join(out, "_login.json"), JSON.stringify({ username, formFound: ok, landed, otpUsed }));
  if (!landed) { console.error("Login gagal untuk", username); ws.close(); chrome.kill(); process.exit(2); }
  console.log("login ok ->", landed, otpUsed ? "(dengan 2FA)" : "");
}

// Sembunyikan spanduk cookie supaya tidak menutupi tangkapan layar (pilihan "Oke" disimpan di browser uji ini saja).
await goto("/robots.txt");
await evalJs(`localStorage.setItem("cookieConsent", "acknowledged")`);

const jsonl = join(out, "hasil.jsonl");
writeFileSync(jsonl, "");
let n = 0;
for (const theme of themes) {
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }, ...(cfg.reduce === false ? [] : [{ name: "prefers-reduced-motion", value: "reduce" }])] });
  for (const w of widths) {
    const mobile = w <= 480;
    await send("Emulation.setDeviceMetricsOverride", { width: w, height: mobile ? 812 : 900, deviceScaleFactor: 1, mobile });
    for (const path of cfg.pages) {
      consoleIssues.length = 0; netIssues.length = 0;
      let rec;
      try {
        await goto(path);
        rec = await evalJs(AUDIT);
        const m = await send("Page.getLayoutMetrics");
        const h = Math.min(Math.ceil(m.result.cssContentSize?.height ?? m.result.contentSize.height), cfg.maxShotHeight ?? 4200);
        const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 55, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
        const slug = path.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
        const file = `${slug}__${w}__${theme}.jpg`;
        writeFileSync(join(out, file), Buffer.from(shot.result.data, "base64"));
        rec.shot = file;
      } catch (e) { rec = { error: String(e).slice(0, 200) }; }
      Object.assign(rec, { req: path, theme, w, console: [...new Set(consoleIssues)].slice(0, 6), net: [...new Set(netIssues)].slice(0, 6) });
      appendFileSync(jsonl, JSON.stringify(rec) + "\n"); n++;
    }
  }
}
console.log("selesai", n, "kunjungan ->", jsonl);
ws.close(); chrome.kill();
