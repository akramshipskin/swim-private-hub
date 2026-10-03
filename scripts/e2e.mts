// Uji alur penuh lewat browser (Hadi 2 Okt malam, #13), dijalankan di pemeriksaan
// GitHub tiap push. Dua jalur:
//   member: daftar -> bayar paket (lunas dari saldo; Midtrans tidak dipanggil di
//           CI) -> booking jadwal besok -> batal
//   coach:  masuk -> tandai Hadir sesi yang sudah lewat -> saldo bertambah
// Data uji dibuat sendiri di database KOSONG lokal (ditolak bila bukan localhost).
//   E2E_BASE=http://localhost:3120 DATABASE_URL=postgresql://qa:qa@localhost:54329/e2e npx tsx scripts/e2e.mts
import { spawn } from "node:child_process";
import { mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PARTNER_AGREEMENTS } from "../src/lib/partner-agreement";

const BASE = process.env.E2E_BASE ?? "http://localhost:3120";
const DB = process.env.DATABASE_URL ?? "";
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(DB) || !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) {
  console.error("Ditolak: uji alur penuh hanya untuk database & server lokal.");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DB }) });
const PASSWORD = "e2e-password-123";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const wib = (d: Date) => new Date(d.getTime() + 7 * 3600e3);
const ymd = (d: Date) => wib(d).toISOString().slice(0, 10);

// ---------- data uji ----------
async function seed() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const pool = await prisma.pool.create({
    data: { name: "Kolam Uji Alur", city: "Jakarta", pricePack4: 260_000, pricePack8: 480_000, openTime: "06:00", closeTime: "21:00", isActive: true },
  });
  const coach = await prisma.user.create({
    data: {
      name: "Coach Uji Alur", phone: "089911110001", passwordHash: hash, role: "COACH", city: "Jakarta", approvedAt: new Date(),
      termsAcceptedAt: new Date(), partnerAgreementAcceptedAt: new Date(), partnerAgreementVersion: PARTNER_AGREEMENTS.COACH.version,
      coachProfile: { create: { pricePack4: 440_000, pricePack8: 800_000 } },
    },
    include: { coachProfile: true },
  });
  await prisma.poolAffiliation.create({ data: { poolId: pool.id, coachId: coach.id } });
  // Jadwal besok 10.00-11.00 WIB untuk jalur member.
  const tomorrow = ymd(new Date(Date.now() + 86_400_000));
  const start = new Date(`${tomorrow}T10:00:00+07:00`);
  await prisma.availability.create({
    data: { coachId: coach.id, poolId: pool.id, date: new Date(`${tomorrow}T00:00:00Z`), startTime: start, endTime: new Date(start.getTime() + 3600e3) },
  });
  // Syarat coach bisa dibeli (Hadi 3 Okt): minimal 4 jam kosong dalam 14 hari.
  for (const d of [2, 3, 4]) {
    const day = ymd(new Date(Date.now() + d * 86_400_000));
    const st = new Date(`${day}T10:00:00+07:00`);
    await prisma.availability.create({ data: { coachId: coach.id, poolId: pool.id, date: new Date(`${day}T00:00:00Z`), startTime: st, endTime: new Date(st.getTime() + 3600e3) } });
  }
  // Sesi 3 jam lalu milik member lain dengan paket 8 sesi yang sudah lunas, untuk jalur coach.
  const other = await prisma.user.create({ data: { name: "Member Lama Uji", phone: "089911110002", passwordHash: hash, role: "MEMBER", approvedAt: new Date() } });
  const dep = await prisma.dependent.create({ data: { memberId: other.id, name: "Anak Lama Uji" } });
  const pkg = await prisma.package.create({
    data: {
      memberId: other.id, dependentId: dep.id, poolId: pool.id, coachId: coach.id, name: "Paket 8 sesi · Coach Uji Alur",
      totalSesi: 8, sisaSesi: 7, jatahCancel: 4, poolPrice: 480_000, coachPrice: 800_000, serviceFee: 83_200, durationDays: 90,
      status: "ACTIVE", startDate: new Date(), expiredDate: new Date(Date.now() + 90 * 86_400_000),
    },
  });
  await prisma.payment.create({ data: { packageId: pkg.id, midtransOrderId: `E2E-${pkg.id}`, amount: 1_363_200, status: "SUCCESS", paidAt: new Date() } });
  const pastStart = new Date(Math.floor((Date.now() - 3 * 3600e3) / 3600e3) * 3600e3);
  const past = await prisma.availability.create({
    data: { coachId: coach.id, poolId: pool.id, date: new Date(`${ymd(pastStart)}T00:00:00Z`), startTime: pastStart, endTime: new Date(pastStart.getTime() + 3600e3), status: "BOOKED" },
  });
  const pastBooking = await prisma.booking.create({ data: { memberId: other.id, availabilityId: past.id, packageId: pkg.id } });
  return { pool, coach, pastBooking, tomorrowDay: Number(tomorrow.slice(8)) };
}

// ---------- browser (Chrome lewat DevTools, tanpa pustaka tambahan) ----------
const CHROME =
  process.env.CHROME_PATH ??
  ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((p) => existsSync(p))!;
const PORT = 9700 + Math.floor(Math.random() * 200);
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "e2e-"))}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
let ws: WebSocket | undefined;
for (let i = 0; i < 150 && !ws; i++) {
  try {
    const list = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    const page = list.find((t) => t.type === "page");
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch {
    /* belum siap */
  }
  if (!ws) await sleep(200);
}
if (!ws) throw new Error("Chrome tidak bisa dijalankan");
await new Promise((r) => (ws!.onopen = r));
let seq = 0;
const waiters = new Map<number, (d: { result?: { result?: { value?: unknown } } }) => void>();
ws.onmessage = (m) => {
  const d = JSON.parse(String(m.data));
  if (d.id && waiters.has(d.id)) {
    waiters.get(d.id)!(d);
    waiters.delete(d.id);
  }
};
const send = (method: string, params: object = {}) =>
  new Promise<{ result?: { result?: { value?: unknown } } }>((r) => {
    const i = ++seq;
    waiters.set(i, r);
    ws!.send(JSON.stringify({ id: i, method, params }));
  });
const js = async <T = unknown,>(expression: string): Promise<T> =>
  (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value as T;
await send("Page.enable");
await send("Runtime.enable");
// Lebar HP: alur utama pengguna (iklan Meta, mayoritas HP).
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });

async function waitFor(desc: string, expr: string, ms = 20_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await js<boolean>(`(() => { try { return !!(${expr}); } catch { return false; } })()`)) return;
    await sleep(250);
  }
  const text = await js<string>("(document.querySelector(\"main\") ?? document.body)?.innerText?.slice(0, 1500)");
  throw new Error(`Menunggu "${desc}" gagal di ${await js<string>("location.pathname")}. Isi layar: ${text}`);
}
async function goto(path: string) {
  await send("Page.navigate", { url: BASE + path });
  await waitFor(`halaman ${path}`, `document.readyState === "complete" && location.pathname === ${JSON.stringify(path.split("?")[0])}`);
}
// Isi input React (controlled): pakai setter bawaan + event input.
async function fill(selector: string, value: string) {
  await waitFor(selector, `document.querySelector(${JSON.stringify(selector)})`);
  await js(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (el.type === "checkbox") { if (!el.checked) el.click(); return; }
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  })()`);
}
// Klik tombol/tautan berdasarkan teksnya (opsional: di dalam elemen yang teksnya cocok).
async function clickText(text: string, within?: string) {
  // Hanya di isi halaman (main) dan dialog, bukan menu navigasi yang punya teks sama.
  const expr = `[...document.querySelectorAll("main button, main a, [role=dialog] button, dialog button")].find((b) => b.innerText.trim() === ${JSON.stringify(text)} && !b.disabled && b.offsetParent !== null${
    within ? ` && b.closest("li")?.innerText.includes(${JSON.stringify(within)})` : ""
  })`;
  await waitFor(`tombol "${text}"`, expr);
  await js(`${expr}.click()`);
}
async function login(phone: string) {
  await goto("/login");
  await fill('input[placeholder="0812xxxxxxx atau email"]', phone);
  await fill('input[type="password"]', PASSWORD);
  await clickText("Masuk");
  await waitFor("masuk berhasil", `location.pathname !== "/login"`);
}
async function logout() {
  await send("Network.clearBrowserCookies");
}
await send("Network.enable");

const ok = (msg: string) => console.log(`✓ ${msg}`);
function expectEq<T>(what: string, got: T, want: T) {
  if (got !== want) throw new Error(`${what}: dapat ${String(got)}, seharusnya ${String(want)}`);
  ok(`${what} = ${String(want)}`);
}

try {
  const s = await seed();
  ok("data uji dibuat");

  // ---------- jalur member ----------
  await goto("/register");
  await fill('input[placeholder="Nama kamu"]', "Member Uji Alur");
  await fill('input[placeholder="0812xxxxxxx"]', "089911110003");
  await fill('input[placeholder="Minimal 8 karakter"]', PASSWORD);
  await fill('input[aria-label="Peserta 1: tanggal lahir"]', "1990-05-05");
  await fill('select[name="city"]', "Jakarta");
  await fill('input[type="checkbox"][required]', "on");
  await sleep(3500); // formulir yang dikirim terlalu cepat ditolak (penangkal bot)
  await clickText("Daftar");
  await waitFor("dialihkan ke Paket", `location.pathname === "/member/paket"`, 30_000);
  ok("daftar member lalu masuk otomatis");

  // "Bayar tiruan": saldo member diisi lewat database (di CI tidak ada Midtrans),
  // pembelian lunas dari saldo = jalur pembayaran yang sama tanpa Midtrans.
  const member = await prisma.user.findUniqueOrThrow({ where: { phone: "089911110003" } });
  await prisma.$transaction([
    prisma.memberWalletTransaction.create({ data: { memberId: member.id, type: "COACH_CHANGE_CREDIT", amount: 800_000, note: "uji alur penuh" } }),
    prisma.user.update({ where: { id: member.id }, data: { memberBalance: { increment: 800_000 } } }),
  ]);
  await goto("/member/paket");
  await clickText("Beli", "Paket 4 sesi");
  await waitFor("pembayaran sukses", `location.pathname === "/pembayaran/sukses"`, 30_000);
  const bought = await prisma.package.findFirstOrThrow({ where: { memberId: member.id }, include: { payments: true } });
  expectEq("status paket setelah bayar", bought.status, "ACTIVE");
  expectEq("harga tersalin (kolam)", bought.poolPrice, 260_000);
  expectEq("sisa saldo member", (await prisma.user.findUniqueOrThrow({ where: { id: member.id } })).memberBalance, 800_000 - 745_500);

  await goto("/member/booking");
  await waitFor("pilihan tanggal", `[...document.querySelectorAll("button")].some((b) => b.querySelector("span.text-base")?.innerText.trim() === "${s.tomorrowDay}")`);
  await js(`[...document.querySelectorAll("button")].find((b) => b.querySelector("span.text-base")?.innerText.trim() === "${s.tomorrowDay}").click()`);
  await clickText("Booking");
  await waitFor("booking tersimpan", `[...document.querySelectorAll("button")].some((b) => b.innerText.trim() === "Batalkan")`);
  expectEq("sisa sesi setelah booking", (await prisma.package.findUniqueOrThrow({ where: { id: bought.id } })).sisaSesi, 3);
  await clickText("Batalkan");
  await clickText("Ya, batalkan");
  await waitFor("booking dibatalkan", `![...document.querySelectorAll("button")].some((b) => b.innerText.trim() === "Batalkan")`);
  await sleep(500);
  const booking = await prisma.booking.findFirstOrThrow({ where: { memberId: member.id } });
  expectEq("status booking", booking.status, "CANCELLED");
  expectEq("sisa sesi setelah batal", (await prisma.package.findUniqueOrThrow({ where: { id: bought.id } })).sisaSesi, 4);
  await logout();

  // ---------- jalur coach ----------
  await login("089911110001");
  await goto("/coach/riwayat-sesi");
  await fill(`form:has(input[name="bookingId"][value="${s.pastBooking.id}"]) select[aria-label="Status kehadiran"]`, "true");
  const until = Date.now() + 20_000;
  while (Date.now() < until && !(await prisma.booking.findUniqueOrThrow({ where: { id: s.pastBooking.id } })).attended) await sleep(300);
  expectEq("tanda hadir", (await prisma.booking.findUniqueOrThrow({ where: { id: s.pastBooking.id } })).attended, true);
  expectEq("saldo coach (100.000 - PPh 500)", (await prisma.coachProfile.findUniqueOrThrow({ where: { id: s.coach.coachProfile!.id } })).walletBalance, 99_500);
  await goto("/coach/saldo");
  await waitFor("saldo tampil", `document.body.innerText.includes("99.500")`);
  ok("halaman Saldo coach menampilkan Rp99.500");
  console.log("\nUji alur penuh: semua lulus.");
} catch (err) {
  console.error("\nUji alur penuh GAGAL:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  ws.close();
  chrome.kill();
  await prisma.$disconnect();
}
