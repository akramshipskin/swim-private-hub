import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn().mockResolvedValue({ user: { id: "owner-1" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/withdrawal-notify", () => ({ notifyAdminsWithdrawalRequested: vi.fn() }));

const poolFind = vi.fn();
const poolUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { pool: { findFirst: (...a: unknown[]) => poolFind(...a), update: (...a: unknown[]) => poolUpdate(...a) } },
}));

const { updateBankInfo } = await import("./actions");

const form = (o: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ bankName: "Mandiri", bankAccountNumber: "9876543210", bankAccountName: "Kolam Tirta", ...o })) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  poolFind.mockResolvedValue({ id: "pool-1" });
  poolUpdate.mockResolvedValue({});
});

describe("pool updateBankInfo", () => {
  it("menyimpan rekening kalau bank dipilih dari daftar", async () => {
    await expect(updateBankInfo("pool-1", null, form({}))).resolves.toEqual({ ok: true });
    expect(poolUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { bankName: "Mandiri", bankAccountNumber: "9876543210", bankAccountName: "Kolam Tirta" } }));
  });

  it("menolak nama bank ketikan bebas", async () => {
    await expect(updateBankInfo("pool-1", null, form({ bankName: "mandiri" }))).resolves.toEqual({ error: "Pilih nama bank dari daftar." });
    expect(poolUpdate).not.toHaveBeenCalled();
  });

  it("tetap menolak kolam yang bukan milik akun ini", async () => {
    poolFind.mockResolvedValue(null);
    await expect(updateBankInfo("pool-x", null, form({}))).resolves.toEqual({ error: "Kolam ini bukan milik akun kamu." });
    expect(poolUpdate).not.toHaveBeenCalled();
  });
});
