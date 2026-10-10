import { describe, expect, it, vi, beforeEach } from "vitest";
import { openSecret } from "@/lib/secret-box";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "coach-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/withdrawal-notify", () => ({ notifyAdminsWithdrawalRequested: vi.fn() }));
const confirmBankChangePassword = vi.fn().mockResolvedValue(null);
const notifyBankChanged = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/bank-change", () => ({ confirmBankChangePassword: (...a: unknown[]) => confirmBankChangePassword(...a), notifyBankChanged: (...a: unknown[]) => notifyBankChanged(...a) }));

const profileFind = vi.fn();
const profileUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { coachProfile: { findUnique: (...a: unknown[]) => profileFind(...a), update: (...a: unknown[]) => profileUpdate(...a) } },
}));

const { updateBankInfo } = await import("./actions");

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ bankName: "BCA", bankAccountNumber: "1234567890", bankAccountName: "Rina", ...o })) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  profileFind.mockResolvedValue({ id: "cp-1" });
  confirmBankChangePassword.mockResolvedValue(null);
  profileUpdate.mockResolvedValue({});
});

describe("coach updateBankInfo", () => {
  it("menyimpan rekening kalau bank dipilih dari daftar", async () => {
    await expect(updateBankInfo(null, form({}))).resolves.toEqual({ ok: true });
    expect(profileUpdate).toHaveBeenCalledWith({
      where: { id: "cp-1" },
      data: { bankName: "BCA", bankAccountNumber: expect.stringMatching(/^enc:v1:/), bankAccountName: "Rina" },
    });
    // Nomor tersimpan terenkripsi, bukan polos, dan bisa dibuka kembali.
    const stored = profileUpdate.mock.calls[0][0].data.bankAccountNumber;
    expect(stored).not.toContain("1234567890");
    expect(openSecret(stored)).toBe("1234567890");
  });

  it("menolak nama bank ketikan bebas (permintaan langsung ke server tanpa lewat dropdown)", async () => {
    await expect(updateBankInfo(null, form({ bankName: "bank abal-abal" }))).resolves.toEqual({ error: "Pilih nama bank dari daftar." });
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("menolak field kosong", async () => {
    await expect(updateBankInfo(null, form({ bankAccountNumber: "" }))).resolves.toEqual({ error: "Semua data rekening wajib diisi." });
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("password salah: rekening tidak disimpan dan tidak ada pemberitahuan (TRD T13)", async () => {
    confirmBankChangePassword.mockResolvedValueOnce("Password salah.");
    expect(await updateBankInfo(null, form({}))).toEqual({ error: "Password salah." });
    expect(profileUpdate).not.toHaveBeenCalled();
    expect(notifyBankChanged).not.toHaveBeenCalled();
  });

  it("berhasil: pemilik dan admin diberi tahu", async () => {
    await updateBankInfo(null, form({}));
    expect(notifyBankChanged).toHaveBeenCalledTimes(1);
  });
});
