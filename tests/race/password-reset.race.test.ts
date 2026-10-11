// Reset password lewat email (P8, Hadi 11 Okt) terhadap Postgres lokal.
import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const sent: { to: string; text: string }[] = [];
vi.mock("@/lib/email", async (orig) => ({
  ...(await orig<typeof import("@/lib/email")>()),
  sendPlainEmail: async (p: { to: string; text: string }) => {
    sent.push(p);
  },
}));

import { prisma } from "@/lib/prisma";
import { reset, mkUser, settle } from "./fx";
import { createResetToken, requestPasswordReset, resetPasswordWithToken, RESET_INVALID_ERROR, RESET_SENT_MESSAGE, RESET_TTL_MS, verifyResetToken } from "@/lib/password-reset";

process.env.AUTH_SECRET ??= "rahasia-uji";
const now = (t: () => Promise<void>) => void t();
const ask = (email: string, ip: string) => requestPasswordReset(email, ip, now);
const doReset = (t: string, a: string, b: string) => resetPasswordWithToken(t, a, b, now);

beforeEach(async () => {
  await reset();
  sent.length = 0;
});

async function member(email = "ortu@x.test") {
  const u = await mkUser("MEMBER");
  return prisma.user.update({ where: { id: u.id }, data: { email, passwordHash: await bcrypt.hash("lama-12345", 4), isActive: true } });
}
const tokenFrom = (text: string) => decodeURIComponent(text.match(/token=([^\s]+)/)![1]);

describe("RESET PASSWORD LEWAT EMAIL", () => {
  it("PR1: email terdaftar dapat tautan; password baru berlaku, sesi lama mati, tautan tidak bisa dipakai lagi", async () => {
    const u = await member();
    expect(await ask("ORTU@x.test ", "1.1.1.1")).toEqual({ ok: RESET_SENT_MESSAGE });
    expect(sent).toHaveLength(1);
    const token = tokenFrom(sent[0].text);
    expect(await doReset(token, "baru-12345", "baru-12345")).toEqual({});
    const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    expect(await bcrypt.compare("baru-12345", after.passwordHash)).toBe(true);
    expect(after.sessionVersion).toBe(u.sessionVersion + 1);
    expect(await doReset(token, "lain-12345", "lain-12345")).toEqual({ error: RESET_INVALID_ERROR });
    // Pemberitahuan "password baru diganti" terkirim ke pemilik.
    expect(sent.map((m) => m.to)).toEqual(["ortu@x.test", "ortu@x.test"]);
  });

  it("PR6: kunci login per akun dan per akun-per-jaringan dibuka (akun lain yang emailnya mirip tidak); status wajib ganti password tidak diubah", async () => {
    const u = await member("ortu_x@x.test");
    await prisma.user.update({ where: { id: u.id }, data: { mustChangePassword: true } });
    await prisma.rateLimitHit.createMany({ data: [{ key: "login:ortu_x@x.test" }, { key: `login-net:9.9.9.9:${u.phone}` }, { key: "login-net:9.9.9.9:ortu_x@x.test" }, { key: "login-ip:9.9.9.9" }, { key: "login-net:9.9.9.9:ortuXx@x.test" }] });
    expect(await doReset(createResetToken(u), "baru-12345", "baru-12345")).toEqual({});
    expect((await prisma.rateLimitHit.findMany({ select: { key: true } })).map((r) => r.key).sort()).toEqual(["login-ip:9.9.9.9", "login-net:9.9.9.9:ortuXx@x.test"]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).mustChangePassword).toBe(true);
  });

  it("PR2: email tidak terdaftar, akun admin, atau akun nonaktif: jawaban sama, tidak ada email", async () => {
    const admin = await mkUser("ADMIN");
    await prisma.user.update({ where: { id: admin.id }, data: { email: "admin@x.test" } });
    const off = await member("off@x.test");
    await prisma.user.update({ where: { id: off.id }, data: { isActive: false } });
    for (const e of ["tidak@x.test", "admin@x.test", "off@x.test"]) expect(await ask(e, "1.1.1.2")).toEqual({ ok: RESET_SENT_MESSAGE });
    expect(sent).toHaveLength(0);
    // Token buatan sendiri untuk admin pun ditolak.
    expect(await verifyResetToken(createResetToken(await prisma.user.findUniqueOrThrow({ where: { id: admin.id } })))).toBeNull();
  });

  it("PR3: kedaluwarsa, tanda tangan diubah, atau password sudah diganti lewat jalan lain = ditolak", async () => {
    const u = await member();
    const t = createResetToken(u);
    expect(await verifyResetToken(t, Date.now() + RESET_TTL_MS + 1000)).toBeNull();
    expect(await verifyResetToken(t.slice(0, -2) + "xx")).toBeNull();
    const [body] = t.split(".");
    expect(await verifyResetToken(`${body}.`)).toBeNull();
    await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash("diganti-123", 4) } });
    expect(await verifyResetToken(t)).toBeNull();
  });

  it("PR4: tautan yang sama diklik dua kali bersamaan -> tepat satu berhasil", async () => {
    const u = await member();
    const t = createResetToken(u);
    const rs = await settle([doReset(t, "satu-12345", "satu-12345"), doReset(t, "dua-123456", "dua-123456")]);
    const ok = rs.filter((r) => r.status === "fulfilled" && !(r.value as { error?: string }).error);
    expect(ok).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).sessionVersion).toBe(u.sessionVersion + 1);
  });

  it("PR5: batas 3 email per jam per alamat; password pendek atau beda konfirmasi ditolak tanpa mengubah apa pun", async () => {
    const u = await member();
    for (let i = 0; i < 5; i++) await ask("ortu@x.test", `2.2.2.${i}`);
    expect(sent).toHaveLength(3);
    const t = createResetToken(u);
    expect((await doReset(t, "pendek", "pendek")).error).toMatch(/minimal 8/);
    expect((await doReset(t, "baru-12345", "beda-12345")).error).toMatch(/tidak sama/);
    expect(await ask("bukan email", "3.3.3.3")).toEqual({ error: "Tulis alamat email yang valid." });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: u.id } })).sessionVersion).toBe(u.sessionVersion);
  });
});
