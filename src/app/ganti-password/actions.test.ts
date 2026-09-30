import { describe, expect, it, vi, beforeEach } from "vitest";

const auth = vi.fn();
const unstableUpdate = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth(), unstable_update: (a: unknown) => unstableUpdate(a) }));
vi.mock("next/navigation", () => ({
  redirect: (p: string) => {
    throw new Error(`NEXT_REDIRECT:${p}`);
  },
}));
const compare = vi.fn().mockResolvedValue(false);
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed"), compare: (...a: unknown[]) => compare(...a) } }));
const createSelfDependent = vi.fn().mockResolvedValue({ id: "dep-self" });
vi.mock("@/lib/dependents", () => ({ createSelfDependent: (...a: unknown[]) => createSelfDependent(...a) }));
const dependentCreateMany = vi.fn();
const dependentUpdate = vi.fn();
const dependentCount = vi.fn().mockResolvedValue(1);

const userUpdate = vi.fn().mockResolvedValue({ sessionVersion: 3 });
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dependent: { count: (...a: unknown[]) => dependentCount(...a) },
    user: { findUnique: vi.fn().mockResolvedValue({ passwordHash: "temp-hash" }) },
    $transaction: (fn: (tx: unknown) => unknown) =>
      fn({ user: { update: (a: unknown) => userUpdate(a) }, dependent: { createMany: (a: unknown) => dependentCreateMany(a), update: (a: unknown) => dependentUpdate(a) } }),
  },
}));

const { changePassword } = await import("./actions");

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

beforeEach(() => { vi.clearAllMocks(); compare.mockResolvedValue(false); });

describe("changePassword (tanpa password lama)", () => {
  it("rejects an account that is not flagged mustChangePassword", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", mustChangePassword: false } });
    const res = await changePassword(null, fd({ newPassword: "abcdefgh", confirmPassword: "abcdefgh" }));
    expect(res?.error).toBeTruthy();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("changes the password, bumps sessionVersion, and keeps this session alive", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "ADMIN", mustChangePassword: true } });
    await expect(
      changePassword(null, fd({ newPassword: "abcdefgh", confirmPassword: "abcdefgh" }))
    ).rejects.toThrow("NEXT_REDIRECT:/admin");
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sessionVersion: { increment: 1 } }) })
    );
    expect(unstableUpdate).toHaveBeenCalledWith(expect.objectContaining({ sessionVersion: 3 }));
  });

  // Password sementara diketahui admin / tercetak di CSV import: memakainya
  // lagi membuat wajib-ganti tidak ada gunanya.
  it("rejects reusing the temporary password", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "MEMBER", mustChangePassword: true } });
    compare.mockResolvedValueOnce(true);
    const res = await changePassword(null, fd({ newPassword: "renang2026", confirmPassword: "renang2026" }));
    expect(res).toEqual({ error: "Password baru harus berbeda dari password sementara." });
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("changePassword: peserta member login pertama", () => {
  const member = { user: { id: "m1", role: "MEMBER", mustChangePassword: true } };
  const base = { newPassword: "abcdefgh", confirmPassword: "abcdefgh" };
  function withParticipants(rows: { type: string; name?: string; date?: string }[]) {
    const f = fd(base);
    for (const r of rows) {
      f.append("participantType", r.type);
      f.append("participantName", r.name ?? "");
      f.append("participantBirthDate", r.date ?? "");
    }
    return f;
  }

  it("menolak peserta tanpa tanggal lahir, password tidak diubah", async () => {
    auth.mockResolvedValue(member);
    dependentCount.mockResolvedValueOnce(0);
    const res = await changePassword(null, withParticipants([{ type: "child", name: "Ani" }]));
    expect(res?.error).toMatch(/tanggal lahir/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("menyimpan anak dan diri sendiri lengkap dengan tanggal lahir", async () => {
    auth.mockResolvedValue(member);
    dependentCount.mockResolvedValueOnce(0);
    await expect(
      changePassword(null, withParticipants([{ type: "self", date: "1990-05-05" }, { type: "child", name: "ani", date: "2018-04-01" }]))
    ).rejects.toThrow("NEXT_REDIRECT:/member/booking");
    expect(dependentCreateMany).toHaveBeenCalledWith({
      data: [{ memberId: "m1", name: "Ani", birthDate: new Date("2018-04-01T00:00:00Z") }],
    });
    expect(dependentUpdate).toHaveBeenCalledWith({ where: { id: "dep-self" }, data: { birthDate: new Date("1990-05-05T00:00:00Z") } });
  });
});
