import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { reset, settle, spread, tally } from "./fx";
import { authorizeCredentials } from "@/lib/authorize";
import { takeAttempt } from "@/lib/rate-limit";
import { newTotpSecret, totpAt, currentStep } from "@/lib/totp";
import { POST as register } from "@/app/api/register/route";
import { POST as registerCoach } from "@/app/api/register-coach/route";

// Sweep keamanan 25 Sep (Antigravity + ChatGPT, dicek Claude): login tanpa batas
// salah password, pendaftaran tanpa batas, belum ada 2FA admin, persetujuan
// S&K hanya di browser. Keputusan Hadi 2 Okt: 3x salah per akun+jaringan, 10x per
// akun dari semua jaringan, 20x per jaringan -> 15 menit, dengan hitung mundur.

beforeEach(reset);

const PASSWORD = "benar12345";
const req = (ip: string) => new Request("http://x/api/auth/callback/credentials", { method: "POST", headers: { "x-forwarded-for": ip } });

async function mkLoginUser(over: { phone?: string; email?: string | null; role?: "ADMIN" | "MEMBER"; isActive?: boolean; totpSecret?: string } = {}) {
  return prisma.user.create({
    data: {
      name: "U",
      phone: over.phone ?? "081234567890",
      email: over.email ?? null,
      role: over.role ?? "MEMBER",
      isActive: over.isActive ?? true,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
      ...(over.totpSecret ? { totpSecret: over.totpSecret, totpEnabledAt: new Date() } : {}),
    },
  });
}

// null = password salah biasa; "ok" = masuk; selain itu = kode error ke browser.
async function login(identifier: string, password: string, ip = "1.1.1.1", otp = "") {
  try {
    const u = await authorizeCredentials({ identifier, password, otp }, req(ip));
    return u ? "ok" : "salah";
  } catch (e) {
    // "locked_742" (sisa detik untuk hitung mundur) disamakan jadi "locked".
    return ((e as { code?: string }).code ?? "THROW:" + String(e)).replace(/^locked_\d+$/, "locked");
  }
}

// Kode error mentah (dengan sisa detik) -- untuk tes hitung mundur.
async function lockCode(identifier: string, password: string, ip = "1.1.1.1") {
  try {
    await authorizeCredentials({ identifier, password, otp: "" }, req(ip));
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? null;
  }
}

describe("Batas salah password", () => {
  it("L1: 10 tebakan salah barengan dari 1 jaringan -> paling banyak 3 yang dicek, sisanya terkunci; password benar pun ikut terkunci 15 menit", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      await reset();
      await mkLoginUser();
      const rs = await settle(Array.from({ length: 10 }, (_, k) => login("081234567890", "salah" + k)));
      const vals = rs.map((r) => (r.status === "fulfilled" ? r.value : "REJECT"));
      expect(vals.filter((v) => v === "salah").length).toBe(3);
      expect(vals.filter((v) => v === "locked").length).toBe(7);
      expect(await login("081234567890", PASSWORD)).toBe("locked");
      tally(sebaran, vals.join(",").replace(/salah/g, "s").replace(/locked/g, "L"));
    }
    spread("L1", sebaran);
  });

  it("L2: 2x salah lalu benar -> masuk, dan hitungan salahnya kembali nol", async () => {
    await mkLoginUser();
    expect(await login("081234567890", "x1")).toBe("salah");
    expect(await login("081234567890", "x2")).toBe("salah");
    expect(await login("081234567890", PASSWORD)).toBe("ok");
    expect(await login("081234567890", "x3")).toBe("salah");
    expect(await login("081234567890", "x4")).toBe("salah");
    expect(await login("081234567890", PASSWORD)).toBe("ok");
    expect(await prisma.rateLimitHit.count({ where: { key: { startsWith: "login:" } } })).toBe(0);
    expect(await prisma.rateLimitHit.count({ where: { key: { startsWith: "login-net:" } } })).toBe(0);
    // Hitungan per-jaringan (batas 20) sengaja TIDAK dihapus oleh login yang
    // berhasil: kalau dihapus, penyerang yang punya 1 akun sah bisa me-reset-nya.
    expect(await prisma.rateLimitHit.count({ where: { key: { startsWith: "login-ip:" } } })).toBe(4);
  });

  it("L3: kunci utama per AKUN+JARINGAN (Hadi 2 Okt): 3x salah dari jaringan A -> A terkunci, pemilik akun dari jaringan B tetap masuk; akun lain tidak ikut", async () => {
    await mkLoginUser();
    await mkLoginUser({ phone: "081234567891" });
    for (let k = 0; k < 3; k++) await login("081234567890", "iseng" + k, "6.6.6.6");
    expect(await login("081234567890", PASSWORD, "6.6.6.6")).toBe("locked");
    expect(await login("081234567890", PASSWORD, "2.2.2.2")).toBe("ok");
    expect(await login("081234567891", PASSWORD, "6.6.6.6")).toBe("ok");
  });

  it("L3c: penyerang memakai banyak jaringan -> setelah 10 salah total, akun terkunci dari jaringan mana pun (termasuk jaringan baru)", async () => {
    await mkLoginUser({ role: "ADMIN" });
    // 4 jaringan x 3 salah = 12 percobaan; yang ke-11 dan ke-12 sudah terkunci.
    const vals: string[] = [];
    for (let n = 0; n < 4; n++) for (let k = 0; k < 3; k++) vals.push(await login("081234567890", "tebak" + k, `9.9.9.${n}`));
    expect(vals.filter((v) => v === "salah").length).toBe(10);
    expect(vals.slice(10).every((v) => v === "locked")).toBe(true);
    expect(await login("081234567890", PASSWORD, "3.3.3.3")).toBe("locked");
  });

  it("L3d: 10 tebakan salah barengan dari 10 jaringan berbeda -> tepat 10 dicek, tidak lebih", async () => {
    await mkLoginUser();
    const rs = await settle(Array.from({ length: 14 }, (_, k) => login("081234567890", "x" + k, `8.8.8.${k}`)));
    const vals = rs.map((r) => (r.status === "fulfilled" ? r.value : "REJECT"));
    expect(vals.filter((v) => v === "salah").length).toBe(10);
    expect(vals.filter((v) => v === "locked").length).toBe(4);
  });

  it("L3b: pesan terkunci membawa sisa detik untuk hitung mundur (1..900) dan menyusut seiring waktu", async () => {
    await mkLoginUser();
    for (let k = 0; k < 3; k++) await login("081234567890", "x" + k);
    const first = await lockCode("081234567890", PASSWORD);
    expect(first).toMatch(/^locked_\d+$/);
    const sec1 = Number(first!.split("_")[1]);
    expect(sec1).toBeGreaterThan(890);
    expect(sec1).toBeLessThanOrEqual(900);
    // Mundurkan semua catatan 5 menit -> sisa tunggu ~600 detik.
    await prisma.rateLimitHit.updateMany({ where: { key: { in: ["login:081234567890", "login-net:1.1.1.1:081234567890"] } }, data: { createdAt: new Date(Date.now() - 5 * 60_000) } });
    const later = Number((await lockCode("081234567890", PASSWORD))!.split("_")[1]);
    expect(later).toBeGreaterThan(590);
    expect(later).toBeLessThanOrEqual(600);
  });

  it("L4: satu jaringan menebak 25 akun berbeda -> setelah 20 salah, jaringan itu terkunci untuk semua akun", async () => {
    const vals: string[] = [];
    for (let k = 0; k < 25; k++) vals.push(await login(`0812345600${String(k).padStart(2, "0")}`, "tebak"));
    expect(vals.slice(0, 20).every((v) => v === "salah")).toBe(true);
    expect(vals.slice(20).every((v) => v === "locked")).toBe(true);
  });

  it("L5: coach yang belum disetujui dengan password benar -> ditolak tapi tidak dihitung salah (tidak terkunci walau mencoba 5x)", async () => {
    await mkLoginUser({ isActive: false });
    for (let k = 0; k < 5; k++) expect(await login("081234567890", PASSWORD)).toBe("salah");
    expect(await prisma.rateLimitHit.count()).toBe(0);
  });

  it("L6: takeAttempt 30 panggilan barengan dengan batas 5 -> tepat 5 tercatat", async () => {
    const ids = await Promise.all(Array.from({ length: 30 }, () => takeAttempt("uji", 5, 60_000)));
    expect(ids.filter(Boolean).length).toBe(5);
    expect(await prisma.rateLimitHit.count({ where: { key: "uji" } })).toBe(5);
  });
});

describe("Nomor HP & email baku saat login", () => {
  it("L7: akun lama tersimpan '+6281234567890' bisa masuk dengan '0812 3456 7890', akun baru '08..' bisa masuk dengan '+62 812-...'", async () => {
    await mkLoginUser({ phone: "+6281234567890" });
    expect(await login("0812 3456 7890", PASSWORD)).toBe("ok");
    await mkLoginUser({ phone: "081299990000" });
    expect(await login("+62 812-9999-0000", PASSWORD)).toBe("ok");
  });

  it("L8: email login tidak peduli huruf besar/kecil (termasuk data lama yang tersimpan huruf besar)", async () => {
    await mkLoginUser({ phone: "081200000001", email: "Budi@Example.com" });
    expect(await login("budi@example.COM", PASSWORD)).toBe("ok");
  });
});

describe("2FA admin", () => {
  const secret = newTotpSecret();

  it("T1: password benar tanpa kode -> diminta kode (tidak dihitung salah); kode benar -> masuk", async () => {
    await mkLoginUser({ phone: "081200000009", role: "ADMIN", totpSecret: secret });
    for (let k = 0; k < 4; k++) expect(await login("081200000009", PASSWORD)).toBe("otp_required");
    expect(await login("081200000009", PASSWORD, "1.1.1.1", totpAt(secret, currentStep()))).toBe("ok");
  });

  it("T2: kode salah dihitung sebagai percobaan salah (3x -> terkunci)", async () => {
    await mkLoginUser({ phone: "081200000009", role: "ADMIN", totpSecret: secret });
    for (let k = 0; k < 3; k++) expect(await login("081200000009", PASSWORD, "1.1.1.1", "000000")).toBe("otp_invalid");
    expect(await login("081200000009", PASSWORD, "1.1.1.1", totpAt(secret, currentStep()))).toBe("locked");
  });

  it("T3: kode yang sama dipakai 5x barengan (dicuri/diulang) -> hanya 1 yang masuk", async () => {
    await mkLoginUser({ phone: "081200000009", role: "ADMIN", totpSecret: secret });
    const code = totpAt(secret, currentStep());
    const rs = await settle(Array.from({ length: 5 }, (_, k) => login("081200000009", PASSWORD, `9.9.9.${k}`, code)));
    const vals = rs.map((r) => (r.status === "fulfilled" ? r.value : "REJECT"));
    // Kunci per akun: hanya 3 percobaan pertama yang dicek (satu masuk, sisanya
    // kode dipakai ulang), percobaan berikutnya ditolak "locked".
    expect(vals.filter((v) => v === "ok").length).toBe(1);
    expect(vals.every((v) => ["ok", "otp_invalid", "locked"].includes(v))).toBe(true);
  });

  it("T4: admin tanpa 2FA terpasang tetap bisa login (lalu diarahkan ke /keamanan oleh proxy/requireRole)", async () => {
    await mkLoginUser({ phone: "081200000009", role: "ADMIN" });
    expect(await login("081200000009", PASSWORD)).toBe("ok");
  });
});

describe("Pendaftaran", () => {
  const ago = Date.now() - 10000;
  const regReq = (body: Record<string, unknown>, ip = "3.3.3.3") =>
    new Request("http://x", { method: "POST", headers: { "x-forwarded-for": ip }, body: JSON.stringify({ name: "a b", password: "12345678", acceptedTerms: true, wantsSelf: true, selfBirthDate: "1990-05-05", birthDate: "1990-05-05", formRenderedAt: ago, ...body }) });

  it("R1: 12 pendaftaran member dari 1 jaringan dalam 1 jam -> 10 berhasil, 2 ditolak 429; jaringan lain tetap bisa", async () => {
    const codes: number[] = [];
    for (let k = 0; k < 12; k++) codes.push((await register(regReq({ phone: `0812700000${String(k).padStart(2, "0")}` }))).status);
    expect(codes.filter((c) => c === 201).length).toBe(10);
    expect(codes.slice(10)).toEqual([429, 429]);
    expect((await register(regReq({ phone: "081270000099" }, "4.4.4.4"))).status).toBe(201);
  });

  it("R2: 6 pendaftaran coach barengan dari 1 jaringan (nomor beda) -> paling banyak 3 akun", async () => {
    const rs = await settle(Array.from({ length: 6 }, (_, k) => registerCoach(regReq({ phone: `0812800000${k}0`, specialties: ["Gaya bebas"] }))));
    expect(rs.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await prisma.user.count({ where: { role: "COACH" } })).toBe(3);
  });

  it("R3: pendaftaran tanpa centang persetujuan (request langsung) ditolak; yang centang tercatat waktu & versinya", async () => {
    expect((await register(regReq({ phone: "081290000001", acceptedTerms: undefined }))).status).toBe(400);
    expect((await register(regReq({ phone: "081290000002", acceptedTerms: "true" }))).status).toBe(400);
    expect((await register(regReq({ phone: "081290000003" }))).status).toBe(201);
    const u = await prisma.user.findFirstOrThrow({ where: { phone: "081290000003" } });
    expect(u.termsAcceptedAt).toBeInstanceOf(Date);
    expect(u.termsVersion).toMatch(/^S&K .+; Privasi .+$/);
    expect(await prisma.user.count()).toBe(1);
  });

  it("R4: nomor yang tersimpan format lama '+62...' tidak bisa didaftarkan ulang dengan '08...'", async () => {
    await mkLoginUser({ phone: "+6281234567890" });
    expect((await register(regReq({ phone: "081234567890" }))).status).toBe(409);
  });
});
