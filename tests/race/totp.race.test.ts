import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { as, fd, jitter, reset, settle, spread, tally } from "./fx";
import { checkInvariants } from "./invariants";
import { authorizeCredentials } from "@/lib/authorize";
import { newTotpSecret, totpAt, currentStep } from "@/lib/totp";
import { confirmTotpSetup, disableTotp, startTotpSetup } from "@/app/keamanan/actions";
import { resetUserTotp } from "@/app/admin/users/actions";

// 2FA opsional untuk coach/member/pemilik kolam (admin tetap wajib). Balapan
// yang diuji: aktivasi barengan, kode sama dipakai dua login, nonaktifkan vs
// login, reset admin vs login. Tiap tes beberapa putaran dengan jitter() dan
// sebaran hasil dicatat lewat spread().

beforeEach(reset);
afterEach(() => vi.restoreAllMocks());

const PASSWORD = "benar12345";
const ROUNDS = 8;
let seq = 0;
const req = (ip: string) => new Request("http://x/api/auth/callback/credentials", { method: "POST", headers: { "x-forwarded-for": ip } });

async function mkUser(role: "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", totp: { secret?: string; enabled?: boolean } = {}, bcryptCost = 4) {
  return prisma.user.create({
    data: {
      name: "U",
      phone: "0812" + String(++seq).padStart(8, "0"),
      role,
      passwordHash: await bcrypt.hash(PASSWORD, bcryptCost),
      totpSecret: totp.secret ?? null,
      totpEnabledAt: totp.enabled ? new Date() : null,
    },
  });
}

async function login(phone: string, otp: string, ip: string) {
  try {
    const u = await authorizeCredentials({ identifier: phone, password: PASSWORD, otp }, req(ip));
    return u ? { r: "ok", sessionVersion: u.sessionVersion } : { r: "salah" };
  } catch (e) {
    return { r: (e as { code?: string }).code ?? "THROW:" + String(e) };
  }
}

// Hasil server action: error dari state, "redirect:<url>" kalau selesai
// (redirect() di tes melempar Error("REDIRECT:...")), atau pesan lain.
async function act(p: Promise<{ error?: string } | null | void>) {
  try {
    const v = await p;
    return v && "error" in v && v.error ? "err:" + v.error : "ok";
  } catch (e) {
    const m = String((e as Error).message);
    return m.startsWith("REDIRECT:") ? "redirect:" + m.slice(9) : "THROW:" + m;
  }
}
const coachSession = (u: { id: string }) => ({ id: u.id, role: "COACH" as const });

// Hitung UPDATE yang berhasil "mengklaim" langkah waktu kode (login & nonaktifkan
// sama-sama menulis totpLastStep). Kode yang sama tidak boleh diklaim dua kali.
function spyStepClaims() {
  const claims: number[] = [];
  const orig = prisma.user.updateMany.bind(prisma.user);
  vi.spyOn(prisma.user, "updateMany").mockImplementation(((args: { data?: { totpLastStep?: unknown } }) => {
    const p = orig(args as never);
    return p.then((res: { count: number }) => {
      if (typeof args.data?.totpLastStep === "number" && res.count === 1) claims.push(args.data.totpLastStep);
      return res;
    });
  }) as never);
  return claims;
}

describe("2FA opsional (coach/member/pemilik kolam)", () => {
  it("A1: 3 konfirmasi aktivasi barengan + 'Buat kunci' baru di tab lain -> aktif paling banyak sekali, dan kalau aktif kuncinya PASTI kunci yang kodenya dicek", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < ROUNDS; i++) {
      await reset();
      const secret = newTotpSecret();
      const u = await mkUser("COACH", { secret });
      const code = totpAt(secret, currentStep());
      const rs = await as(coachSession(u), () =>
        settle([
          ...Array.from({ length: 3 }, () => jitter(15).then(() => act(confirmTotpSetup(null, fd({ code, password: PASSWORD }))))),
          jitter(15).then(() => act(startTotpSetup())),
        ]),
      );
      const vals = rs.map((r) => (r.status === "fulfilled" ? r.value : "REJECT"));
      const db = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      expect(vals.some((v) => v.startsWith("THROW") || v === "REJECT")).toBe(false);
      if (db.totpEnabledAt) {
        expect(db.totpSecret).toBe(secret);
        expect(vals.slice(0, 3).some((v) => v === "redirect:/profil")).toBe(true);
      } else {
        // Kunci diganti sebelum ada konfirmasi yang menang: semua konfirmasi ditolak.
        expect(db.totpSecret).not.toBe(secret);
        expect(vals.slice(0, 3).every((v) => v.startsWith("err:"))).toBe(true);
      }
      tally(sebaran, db.totpEnabledAt ? "aktif" : "kunci-diganti");
    }
    spread("A1", sebaran);
    expect(await checkInvariants()).toEqual([]);
  });

  it("A2: coach dengan 2FA, dua login dengan kode yang sama tepat barengan -> hanya satu yang masuk", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < ROUNDS; i++) {
      await reset();
      const secret = newTotpSecret();
      const u = await mkUser("COACH", { secret, enabled: true });
      const code = totpAt(secret, currentStep());
      const vals = await Promise.all([0, 1].map((k) => jitter(10).then(() => login(u.phone!, code, `5.5.${i}.${k}`))));
      expect(vals.filter((v) => v.r === "ok").length).toBe(1);
      expect(vals.filter((v) => v.r === "otp_invalid").length).toBe(1);
      tally(sebaran, vals.map((v) => v.r).join(","));
    }
    spread("A2", sebaran);
    expect(await checkInvariants()).toEqual([]);
  });

  it("A3: nonaktifkan 2FA vs login dengan kode yang sama barengan -> kode hanya terpakai sekali; keadaan akhir sesuai pemenang", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < ROUNDS; i++) {
      await reset();
      const secret = newTotpSecret();
      const u = await mkUser("COACH", { secret, enabled: true });
      const code = totpAt(secret, currentStep());
      const claims = spyStepClaims();
      const [off, lg] = await Promise.all([
        jitter(20).then(() => as(coachSession(u), () => act(disableTotp(null, fd({ password: PASSWORD, code }))))),
        jitter(20).then(() => login(u.phone!, code, `6.6.${i}.1`)),
      ]);
      vi.restoreAllMocks();
      const db = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      // Tepat satu yang memakai kode ini. (Login yang membaca akun SETELAH 2FA
      // mati masuk cukup dengan password -- tidak memakai kode.)
      expect(claims.length).toBe(1);
      if (off === "redirect:/profil") {
        expect(db.totpEnabledAt).toBeNull();
        expect(db.totpSecret).toBeNull();
      } else {
        expect(off).toMatch(/^err:Kode ini sudah dipakai/);
        expect(lg.r).toBe("ok");
        expect(db.totpEnabledAt).not.toBeNull();
      }
      tally(sebaran, `nonaktif=${off === "redirect:/profil" ? "ya" : "tidak"},login=${lg.r}`);
    }
    spread("A3", sebaran);
    expect(await checkInvariants()).toEqual([]);
  });

  it("A4: admin reset 2FA vs login dengan kode barengan -> reset tidak pernah 'dibatalkan' login, sesi dari sebelum reset pasti mati", async () => {
    const sebaran: Record<string, number> = {};
    for (let i = 0; i < ROUNDS; i++) {
      await reset();
      const admin = await mkUser("ADMIN", { secret: newTotpSecret(), enabled: true });
      const secret = newTotpSecret();
      // bcrypt cost 10 (produksi 12): jeda antara login membaca akun dan
      // mengklaim kode jadi puluhan ms seperti di produksi, jadi reset bisa
      // mendarat DI TENGAH login (dengan cost 4 jedanya ~1 ms, tak pernah kena).
      const u = await mkUser("POOL_OWNER", { secret, enabled: true }, 10);
      const code = totpAt(secret, currentStep());
      const [rs, lg] = await Promise.all([
        jitter(60).then(() => as({ id: admin.id, role: "ADMIN" }, () => act(resetUserTotp(u.id)))),
        login(u.phone!, code, `7.7.${i}.1`),
      ]);
      const db = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
      expect(rs).toBe("ok");
      expect(db).toMatchObject({ totpSecret: null, totpEnabledAt: null, totpLastStep: null, sessionVersion: u.sessionVersion + 1 });
      // Login yang lolos dengan versi sesi lama ditolak callback jwt di request
      // berikutnya (auth.ts: sessionVersion beda -> keluar). Yang lolos dengan
      // versi baru membaca akun sesudah reset (masuk cukup dengan password).
      if (lg.r !== "ok") expect(lg.r).toBe("otp_invalid");
      tally(sebaran, lg.r === "ok" ? `login-ok-v${lg.sessionVersion === db.sessionVersion ? "baru" : "lama(mati)"}` : "login-ditolak");
    }
    spread("A4", sebaran);
    expect(await checkInvariants()).toEqual([]);
  });

  it("A4b: urutan terburuk dipaksa -- reset admin mendarat TEPAT setelah login membaca akun, sebelum kodenya diklaim -> login ditolak, reset utuh", async () => {
    const admin = await mkUser("ADMIN", { secret: newTotpSecret(), enabled: true });
    const secret = newTotpSecret();
    const u = await mkUser("COACH", { secret, enabled: true });
    const orig = prisma.user.findFirst.bind(prisma.user);
    vi.spyOn(prisma.user, "findFirst").mockImplementation((async (args: never) => {
      const found = await orig(args);
      await as({ id: admin.id, role: "ADMIN" }, () => resetUserTotp(u.id));
      return found;
    }) as never);
    const lg = await login(u.phone!, totpAt(secret, currentStep()), "7.7.9.9");
    vi.restoreAllMocks();
    expect(lg.r).toBe("otp_invalid");
    expect(await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).toMatchObject({ totpSecret: null, totpEnabledAt: null, totpLastStep: null });
    // Coba lagi: 2FA sudah direset -> cukup password.
    expect((await login(u.phone!, "", "7.7.9.10")).r).toBe("ok");
    expect(await checkInvariants()).toEqual([]);
  });

  it("A5: admin tetap wajib -- tidak bisa menonaktifkan sendiri, dan tombol reset admin menolak akun admin", async () => {
    const secret = newTotpSecret();
    const admin = await mkUser("ADMIN", { secret, enabled: true });
    const other = await mkUser("ADMIN", { secret: newTotpSecret(), enabled: true });
    const code = totpAt(secret, currentStep());
    expect(await as({ id: admin.id, role: "ADMIN" }, () => act(disableTotp(null, fd({ password: PASSWORD, code }))))).toBe("err:2FA wajib untuk admin.");
    expect(await as({ id: admin.id, role: "ADMIN" }, () => act(resetUserTotp(other.id)))).toMatch(/^err:/);
    expect(await as({ id: admin.id, role: "ADMIN" }, () => act(resetUserTotp(admin.id)))).toMatch(/^err:/);
    const coach = await mkUser("COACH", { secret: newTotpSecret(), enabled: true });
    expect(await as(coachSession(coach), () => act(resetUserTotp(other.id)))).toBe("redirect:/login");
    expect(await prisma.user.count({ where: { totpEnabledAt: { not: null } } })).toBe(3);
    expect(await checkInvariants()).toEqual([]);
  });

  it("A6: nonaktifkan butuh password DAN kode yang benar; 3x salah -> terkunci 15 menit", async () => {
    const secret = newTotpSecret();
    const u = await mkUser("MEMBER", { secret, enabled: true });
    const s = { id: u.id, role: "MEMBER" as const };
    const code = totpAt(secret, currentStep());
    expect(await as(s, () => act(disableTotp(null, fd({ password: "salah", code }))))).toBe("err:Password salah.");
    expect(await as(s, () => act(disableTotp(null, fd({ password: PASSWORD, code: "000000" }))))).toMatch(/^err:Kode salah/);
    expect(await as(s, () => act(disableTotp(null, fd({ password: PASSWORD, code: "" }))))).toBe("err:Isi password dan kode 6 digit.");
    expect(await as(s, () => act(disableTotp(null, fd({ password: "salah2", code }))))).toBe("err:Password salah.");
    expect(await as(s, () => act(disableTotp(null, fd({ password: PASSWORD, code }))))).toMatch(/^err:Terlalu banyak/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).totpEnabledAt).not.toBeNull();
    expect(await checkInvariants()).toEqual([]);
  });

  it("A7: member tanpa 2FA masuk cukup dengan password; setelah memasang, login tanpa kode -> otp_required", async () => {
    const u = await mkUser("MEMBER");
    expect((await login(u.phone!, "", "8.8.8.1")).r).toBe("ok");
    const s = { id: u.id, role: "MEMBER" as const };
    await as(s, () => startTotpSetup());
    const { totpSecret } = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: totpAt(totpSecret!, currentStep()), password: PASSWORD }))))).toBe("redirect:/profil");
    expect((await login(u.phone!, "", "8.8.8.2")).r).toBe("otp_required");
    expect(await checkInvariants()).toEqual([]);
  });

  it("A8: memasang 2FA butuh password yang benar; hanya password salah yang dihitung (3x -> terkunci 15 menit), kode salah tidak", async () => {
    const u = await mkUser("COACH");
    const s = coachSession(u);
    await as(s, () => startTotpSetup());
    const { totpSecret } = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    const code = () => totpAt(totpSecret!, currentStep());
    expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: code() }))))).toBe("err:Isi password akunmu.");
    for (let i = 0; i < 5; i++) {
      expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: "000000", password: PASSWORD }))))).toMatch(/^err:Kode salah/);
    }
    expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: code(), password: "salah1" }))))).toBe("err:Password salah.");
    expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: code(), password: "salah2" }))))).toBe("err:Password salah.");
    expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: code(), password: "salah3" }))))).toBe("err:Password salah.");
    expect(await as(s, () => act(confirmTotpSetup(null, fd({ code: code(), password: PASSWORD }))))).toMatch(/^err:Terlalu banyak/);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).totpEnabledAt).toBeNull();
    expect(await checkInvariants()).toEqual([]);
  });
});
