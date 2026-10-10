// Render ulang aset sosial brand (foto profil, banner LinkedIn, banner persegi) dari logo vektor + Sora Bold.
// Jalankan: node scripts/render-brand-social.mjs [profile|linkedin|square ...]
//   --out=DIR  tulis ke folder lain saja (buat membandingkan, tidak menyentuh brand-kit).
// Butuh Google Chrome. Bukan lokasi bawaan macOS? set CHROME_PATH.
// Ganti tagline: samakan TAGLINE dengan brand-kit/MESSAGING.md, jalankan ulang, commit hasilnya.
// Hasil ditulis ke brand-kit/social dan public/brand-kit/social (dua salinan harus kembar).
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { crc32 } from "node:zlib";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SCALE = 4;
const TAGLINE = "Aplikasi les renang privat. Pilih coach, pilih kolam, dan pilih jamnya.";

const CREAM = "#F6F6EE", CHAR = "#14140F", LIME = "#C6FF3D", LIMEDARK = "#6F8F1E", MUTED = "#5C5945";

// Semua angka dalam piksel 1x; hasil akhir = 1x * SCALE. Angka diukur dari banner yang sudah disetujui.
// wm = wordmark "swim.privatehub" (Sora 700, jarak huruf -0.0217em); tg = tagline (Sora 700).
const ASSETS = {
  square: { file: "banner-square-6000x2000.png", w: 1500, h: 500, bg: CREAM,
    mark: { size: 170, x: 665, y: 85 },
    wm: { size: 79.25, x: 415, y: 294, color: CHAR, dot: LIMEDARK },
    tg: { size: 26, color: MUTED, y: 386, center: 750 } },
  linkedin: { file: "banner-linkedin-6336x1584.png", w: 1584, h: 396, bg: CHAR,
    mark: { size: 140, x: 90, y: 128 },
    wm: { size: 85.5, x: 270, y: 134, color: CREAM, dot: LIME },
    tg: { size: 28, color: LIME, y: 242, left: 272 } },
  // Foto profil = tanda selebar penuh tanpa sudut (Hadi 10 Okt: jangan kotak di dalam lingkaran);
  // platform memotongnya bulat, jadi lingkaran terisi penuh lime dengan gelombang charcoal.
  profile: { file: "profile-picture-2000.png", w: 500, h: 500, bg: "transparent",
    mark: { size: 500, x: 0, y: 0, square: true } },
};

const font = readFileSync(join(ROOT, "brand-kit/fonts/sora-latin-variable.woff2")).toString("base64");

function html(a) {
  const tg = a.tg && (a.tg.center !== undefined
    ? `left:${a.tg.center - a.w / 2}px;width:${a.w}px;text-align:center`
    : `left:${a.tg.left}px`);
  return `<!doctype html><meta charset=utf-8><style>
@font-face{font-family:Sora;font-weight:100 800;src:url(data:font/woff2;base64,${font}) format('woff2')}
html,body{margin:0;background:${a.bg};width:${a.w}px;height:${a.h}px;overflow:hidden;position:relative}
.t{position:absolute;white-space:nowrap;font-family:Sora;font-weight:700;line-height:1}
</style>
<svg style="position:absolute;left:${a.mark.x}px;top:${a.mark.y}px" width="${a.mark.size}" height="${a.mark.size}" viewBox="8 8 84 84" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="m"><rect x="8" y="8" width="84" height="84" rx="${a.mark.square ? 0 : 26}"/></clipPath></defs>
<rect x="8" y="8" width="84" height="84" rx="${a.mark.square ? 0 : 26}" fill="${LIME}"/>
<g clip-path="url(#m)"><path d="M8,64 Q30,52 50,64 Q70,76 92,64 L92,92 L8,92 Z" fill="${CHAR}"/></g></svg>
${a.wm ? `<div class=t style="left:${a.wm.x}px;top:${a.wm.y}px;font-size:${a.wm.size}px;letter-spacing:-0.0217em;color:${a.wm.color}">swim<span style="color:${a.wm.dot}">.</span>privatehub</div>` : ""}
${a.tg ? `<div class=t style="${tg};top:${a.tg.y}px;font-size:${a.tg.size}px;color:${a.tg.color}">${TAGLINE}</div>` : ""}`;
}

// Tambah penanda 300 DPI (chunk pHYs) ke PNG hasil Chrome.
function tag300dpi(png) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const head = Buffer.alloc(4); head.writeUInt32BE(data.length);
    const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(body));
    return Buffer.concat([head, body, tail]);
  };
  const ppm = Buffer.alloc(9); ppm.writeUInt32BE(11811, 0); ppm.writeUInt32BE(11811, 4); ppm[8] = 1; // 300 DPI = 11811 px/m
  const out = [png.subarray(0, 8)];
  for (let i = 8; i < png.length;) {
    const len = png.readUInt32BE(i), type = png.toString("latin1", i + 4, i + 8);
    const raw = png.subarray(i, i + 12 + len);
    if (type !== "pHYs") out.push(raw);
    if (type === "IHDR") out.push(chunk("pHYs", ppm));
    i += 12 + len;
  }
  return Buffer.concat(out);
}

function render(name) {
  const a = ASSETS[name];
  const dir = mkdtempPath(name);
  const page = join(dir, "page.html"), shot = join(dir, "shot.png");
  writeFileSync(page, html(a));
  const r = spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--force-device-scale-factor=${SCALE}`,
    `--window-size=${a.w},${a.h}`, `--screenshot=${shot}`, "--default-background-color=00000000", "--virtual-time-budget=3000",
    `file://${page}`], { stdio: "pipe" });
  if (r.status !== 0) throw new Error(`Chrome gagal (${CHROME}): ${r.stderr}`);
  const png = readFileSync(shot);
  const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
  if (w !== a.w * SCALE || h !== a.h * SCALE) throw new Error(`${name}: ukuran ${w}x${h}, harusnya ${a.w * SCALE}x${a.h * SCALE}`);
  return tag300dpi(png);
}

const mkdtempPath = (name) => { const d = join(tmpdir(), `sph-brand-${name}-${process.pid}`); mkdirSync(d, { recursive: true }); return d; };

const outArg = process.argv.find((x) => x.startsWith("--out="))?.slice(6);
const names = process.argv.slice(2).filter((x) => !x.startsWith("--"));
for (const name of names.length ? names : Object.keys(ASSETS)) {
  if (!ASSETS[name]) throw new Error(`Tidak dikenal: ${name} (pilihan: ${Object.keys(ASSETS).join(", ")})`);
  const png = render(name);
  for (const dir of outArg ? [outArg] : ["brand-kit/social", "public/brand-kit/social"]) {
    const d = outArg ? dir : join(ROOT, dir);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, ASSETS[name].file), png);
    console.log(`${name} -> ${join(d, ASSETS[name].file)}`);
  }
}
