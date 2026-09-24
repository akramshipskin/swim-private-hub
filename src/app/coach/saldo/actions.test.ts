import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "coach-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/withdrawal-notify", () => ({ notifyAdminsWithdrawalRequested: vi.fn() }));

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
  profileUpdate.mockResolvedValue({});
});

describe("coach updateBankInfo", () => {
  it("menyimpan rekening kalau bank dipilih dari daftar", async () => {
    await expect(updateBankInfo(null, form({}))).resolves.toEqual({ ok: true });
    expect(profileUpdate).toHaveBeenCalledWith({
      where: { id: "cp-1" },
      data: { bankName: "BCA", bankAccountNumber: "1234567890", bankAccountName: "Rina" },
    });
  });

  it("menolak nama bank ketikan bebas (permintaan langsung ke server tanpa lewat dropdown)", async () => {
    await expect(updateBankInfo(null, form({ bankName: "bank abal-abal" }))).resolves.toEqual({ error: "Pilih nama bank dari daftar." });
    expect(profileUpdate).not.toHaveBeenCalled();
  });

  it("menolak field kosong", async () => {
    await expect(updateBankInfo(null, form({ bankAccountNumber: "" }))).resolves.toEqual({ error: "Semua field rekening wajib diisi." });
    expect(profileUpdate).not.toHaveBeenCalled();
  });
});
