import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: (...a: unknown[]) => findUnique(...a) } } }));
const takeAttempt = vi.fn();
const forgetAttempts = vi.fn();
vi.mock("@/lib/rate-limit", () => ({ takeAttempt: (...a: unknown[]) => takeAttempt(...a), forgetAttempts: (...a: unknown[]) => forgetAttempts(...a), PASSWORD_CONFIRM_FAILS: 3, LOGIN_WINDOW_MS: 1 }));
vi.mock("bcryptjs", () => ({ default: { compare: async (p: string, h: string) => h === `hash:${p}` } }));
const notifyUser = vi.fn().mockResolvedValue(undefined);
const notifyAdmins = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notify", () => ({ notifyUser: (...a: unknown[]) => notifyUser(...a), notifyAdmins: (...a: unknown[]) => notifyAdmins(...a) }));

const { confirmBankChangePassword, notifyBankChanged } = await import("./bank-change");

beforeEach(() => {
  vi.clearAllMocks();
  takeAttempt.mockResolvedValue("hit-1");
  findUnique.mockResolvedValue({ passwordHash: "hash:benar123" });
});

describe("confirmBankChangePassword (TRD T13)", () => {
  it("kosong ditolak tanpa menghitung percobaan", async () => {
    expect(await confirmBankChangePassword("u1", "")).toMatch(/Isi password/);
    expect(takeAttempt).not.toHaveBeenCalled();
  });
  it("salah ditolak dan percobaan tetap dihitung; benar lolos dan percobaan dihapus", async () => {
    expect(await confirmBankChangePassword("u1", "salah")).toBe("Password salah.");
    expect(forgetAttempts).not.toHaveBeenCalled();
    expect(await confirmBankChangePassword("u1", "benar123")).toBeNull();
    expect(forgetAttempts).toHaveBeenCalledWith({ ids: ["hit-1"] });
  });
  it("lewat batas percobaan: ditahan 15 menit", async () => {
    takeAttempt.mockResolvedValueOnce(null);
    expect(await confirmBankChangePassword("u1", "benar123")).toMatch(/Tunggu 15 menit/);
  });
});

describe("notifyBankChanged", () => {
  it("pemilik dan admin diberi tahu, hanya 4 digit terakhir yang disebut", async () => {
    await notifyBankChanged({ ownerIds: ["o1", "o2"], who: "Kolam Melati", bankName: "BCA", accountNumber: "1234567890", url: "/pool/saldo" });
    expect(notifyUser).toHaveBeenCalledTimes(2);
    expect(notifyUser.mock.calls[0][2]).toContain("akhiran 7890");
    expect(notifyUser.mock.calls[0][2]).not.toContain("123456");
    expect(notifyAdmins).toHaveBeenCalledTimes(1);
  });
});
