import { describe, expect, it, vi } from "vitest";

const onSessionAttended = vi.fn();
const onSessionUnattended = vi.fn();
vi.mock("@/lib/affiliate", () => ({
  onSessionAttended: (...a: unknown[]) => onSessionAttended(...a),
  onSessionUnattended: (...a: unknown[]) => onSessionUnattended(...a),
}));

const { creditSessionRevenue, reverseSessionRevenue } = await import("./wallet");
import type { Prisma } from "@/generated/prisma/client";

// Mock minimal buat tx.pool/tx.coachProfile/tx.walletTransaction -- cuma
// method yang beneran dipanggil wallet.ts, bukan seluruh Prisma.TransactionClient.
function createMockTx(overrides?: {
  pool?: { commissionPercent: number; coachSharePercent: number };
  walletTxns?: unknown[];
  platformSums?: Record<string, number>;
  // Jumlah baris yang lolos syarat "saldo cukup" (0 = saldo sudah dicairkan).
  poolReversible?: number;
  coachReversible?: number;
}) {
  const pool = overrides?.pool ?? { commissionPercent: 15, coachSharePercent: 55 };
  return {
    pool: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(pool),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: overrides?.poolReversible ?? 1 }),
    },
    coachProfile: {
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: overrides?.coachReversible ?? 1 }),
    },
    walletTransaction: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      aggregate: vi.fn(async ({ where }: { where: { type: string } }) => ({
        _sum: {
          amount:
            overrides?.platformSums?.[where.type] ??
            ((overrides?.walletTxns ?? []) as { type: string; amount: number }[])
              .filter((t) => t.type === where.type)
              .reduce((n, t) => n + t.amount, 0),
        },
      })),
      findFirst: vi.fn(async ({ where }: { where: { type: string } }) =>
        (overrides?.walletTxns ?? []).find((t) => (t as { type: string }).type === where.type) ?? null
      ),
    },
  } as unknown as Prisma.TransactionClient;
}

describe("creditSessionRevenue", () => {
  // Regression: nilai ini persis kasus yang diverifikasi live 2026-09-16
  // (booking beneran, payment Rp750.000/8 sesi, kolam commission 15% +
  // coach share 55%) -- pool dapet Rp28.125, coach dapet Rp51.563.
  // Catatan: sesi lama (dikreditkan sebelum 30 Sep 2026) tercatat dengan PPN 12%;
  // pembalikan membaca jumlah tercatat (lihat tes reverseSessionRevenue), bukan tarif.
  it("splits perSessionValue by the pool's commission and coach-share percent", async () => {
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 55 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 93750,
    });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { increment: 28125 } },
    });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { increment: 51563 } },
    });
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125, bookingId: "booking-1" },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563, bookingId: "booking-1" },
        { type: "PLATFORM_REVENUE", amount: 12668, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: 1394, bookingId: "booking-1" },
      ],
    });
  });

  it("rounds each share independently (may not sum exactly to perSessionValue)", async () => {
    // 93750 * 55% = 51562.5 -> rounds up to 51563; 93750 * 30% = 28125 exact.
    // Sisa platform implisit = 93750 - 51563 - 28125 = 62, bukan bug --
    // laporan Komisi ngitung ulang dari sumber yang sama, bukan nyimpen ini.
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 55 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 93750,
    });

    const call = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const total = call.data.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0);
    // Platform = sisa setelah kolam & coach, jadi total baris = nilai sesi utuh.
    expect(total).toBe(93750);
  });

  it("tidak pernah kehilangan atau menciptakan rupiah, berapa pun harga & persennya", async () => {
    // Pembulatan tiap bagian bisa meleset 1 rupiah, tapi bagian platform =
    // sisa, jadi jumlah semua baris ledger harus persis nilai sesi.
    for (const perSessionValue of [93_750, 112_500, 100_000, 133_333, 1, 7, 999_999]) {
      for (const [commissionPercent, coachSharePercent] of [
        [15, 55],
        [10, 60],
        [0, 100],
        // Regression: komisi 0% + coach 50% -> coach & kolam sama-sama
        // dibulatkan ke atas, dulu total kredit > nilai sesi (+Rp1).
        [0, 50],
        [33, 33],
        [12, 45],
      ]) {
        const tx = createMockTx({ pool: { commissionPercent, coachSharePercent } });
        await creditSessionRevenue(tx, {
          poolId: "pool-1",
          coachProfileId: "coach-1",
          bookingId: "booking-1",
          perSessionValue,
        });
        const call = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
        const total = call.data.reduce((sum: number, row: { amount: number }) => sum + row.amount, 0);
        expect({ perSessionValue, commissionPercent, coachSharePercent, total }).toEqual({
          perSessionValue,
          commissionPercent,
          coachSharePercent,
          total: perSessionValue,
        });
      }
    }
  });

  it("skips crediting the coach entirely when coachSharePercent is 0", async () => {
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 0 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 100000,
    });

    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000, bookingId: "booking-1" },
        { type: "PLATFORM_REVENUE", amount: 13514, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: 1486, bookingId: "booking-1" },
      ],
    });
  });

  it("credits the pool with 100% minus commission minus coach share, not just 100% minus commission", async () => {
    // Kalo salah rumus (misal lupa kurangin coachSharePercent), pool bakal
    // kekredit lebih dari yang seharusnya -- coach share HARUS keluar dari
    // harga sesi yang sama, bukan dari sisa kolam.
    const tx = createMockTx({ pool: { commissionPercent: 20, coachSharePercent: 40 } });

    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 100000,
    });

    // pool = 100% - 20% - 40% = 40% dari 100000 = 40000 (BUKAN 80000 = 100%-20%)
    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { increment: 40000 } },
    });
  });
});

describe("reverseSessionRevenue", () => {
  it("decrements both wallets and writes negated ledger rows matching the original credit", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563 },
      ],
      platformSums: { SESSION_REVENUE: 28125, SESSION_PAYOUT: 51563, PLATFORM_REVENUE: 12555, PLATFORM_TAX: 1507 },
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 28125 } },
    });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { decrement: 51563 } },
    });
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: -28125, bookingId: "booking-1" },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: -51563, bookingId: "booking-1" },
        { type: "PLATFORM_REVENUE", amount: -12555, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: -1507, bookingId: "booking-1" },
      ],
    });
  });

  it("reverses the amount that was actually credited, not a freshly recomputed one", async () => {
    // Kalo commissionPercent/coachSharePercent kolam berubah SETELAH kredit
    // awal, reversal tetep harus balikin angka LAMA (dari ledger), bukan
    // hitung ulang pake persentase yang baru -- tesnya: findFirst return
    // amount yang beda dari apa yang bakal keluar kalo dihitung ulang.
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 999 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 111 },
      ],
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 999 } },
    });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { decrement: 111 } },
    });
  });

  it("does nothing when no matching SESSION_REVENUE ledger row exists", async () => {
    const tx = createMockTx({ walletTxns: [] });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).not.toHaveBeenCalled();
    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  it("still reverses the pool share when the coach payout row is missing (coachAmount was 0)", async () => {
    const tx = createMockTx({
      walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 85000 }],
    });

    await reverseSessionRevenue(tx, { bookingId: "booking-1" });

    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 85000 } },
    });
    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: -85000, bookingId: "booking-1" }],
    });
  });

  it("reverses the net credited amount, not a leftover negative row, after repeated toggles", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: -28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: -51563 },
      ],
      platformSums: { SESSION_REVENUE: 28125, SESSION_PAYOUT: 51563 },
    });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { walletBalance: { decrement: 28125 } },
    });
  });

  it("does nothing when the booking has no net credit left", async () => {
    const tx = createMockTx({ walletTxns: [{ type: "SESSION_REVENUE", poolId: "pool-1", amount: 0 }] });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).not.toHaveBeenCalled();
  });

  // Keputusan Hadi 29 Sep (menggantikan D3): pembalikan tidak ditolak walau
  // uangnya sudah dicairkan -- saldo boleh minus. Pengurangan tanpa syarat
  // saldo (update biasa, bukan updateMany dengan walletBalance >= nominal).
  it("reverses even when the balance was already withdrawn (balance may go negative)", async () => {
    const tx = createMockTx({
      walletTxns: [
        { type: "SESSION_REVENUE", poolId: "pool-1", amount: 28125 },
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 51563 },
      ],
    });
    await reverseSessionRevenue(tx, { bookingId: "booking-1" });
    expect(tx.pool.updateMany).not.toHaveBeenCalled();
    expect(tx.coachProfile.updateMany).not.toHaveBeenCalled();
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { decrement: 51563 } },
    });
  });
});

describe("creditSessionRevenue: peserta tidak datang (attended=false)", () => {
  it("coach dapat 50% dari bagian normal, kolam Rp0, sisanya platform (PPN dipisah)", async () => {
    // Nilai sesi 100.000, coach 40% (normal 40.000) -> tidak datang 20.000.
    const tx = createMockTx({ pool: { commissionPercent: 10, coachSharePercent: 40 } });
    await creditSessionRevenue(tx, {
      poolId: "pool-1",
      coachProfileId: "coach-1",
      bookingId: "booking-1",
      perSessionValue: 100000,
      attended: false,
    });
    expect(tx.pool.update).not.toHaveBeenCalled();
    expect(tx.coachProfile.update).toHaveBeenCalledWith({
      where: { id: "coach-1" },
      data: { walletBalance: { increment: 20000 } },
    });
    // 80.000 ke platform: PPN 11% di dalamnya = round(80000*11/111) = 7928.
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "SESSION_PAYOUT", coachProfileId: "coach-1", amount: 20000, bookingId: "booking-1" },
        { type: "PLATFORM_REVENUE", amount: 72072, bookingId: "booking-1" },
        { type: "PLATFORM_TAX", amount: 7928, bookingId: "booking-1" },
      ],
    });
  });

  it("membulatkan ke bawah bagian coach yang ganjil (tidak pernah melebihi 50%)", async () => {
    const tx = createMockTx({ pool: { commissionPercent: 15, coachSharePercent: 55 } });
    // normal = round(93750*55/100) = 51563 -> 50% = floor(25781.5) = 25781
    await creditSessionRevenue(tx, { poolId: "pool-1", coachProfileId: "coach-1", bookingId: "b", perSessionValue: 93750, attended: false });
    expect(tx.coachProfile.update).toHaveBeenCalledWith({ where: { id: "coach-1" }, data: { walletBalance: { increment: 25781 } } });
    const rows = (vi.mocked(tx.walletTransaction.createMany).mock.calls[0][0] as { data: { amount: number }[] }).data;
    expect(rows.reduce((n, r) => n + r.amount, 0)).toBe(93750);
  });

  it("tanpa bagian coach (0%) semua ke platform, tidak ada baris coach", async () => {
    const tx = createMockTx({ pool: { commissionPercent: 100, coachSharePercent: 0 } });
    await creditSessionRevenue(tx, { poolId: "pool-1", coachProfileId: "coach-1", bookingId: "b", perSessionValue: 1120, attended: false });
    expect(tx.coachProfile.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.createMany).toHaveBeenCalledWith({
      data: [
        { type: "PLATFORM_REVENUE", amount: 1009, bookingId: "b" },
        { type: "PLATFORM_TAX", amount: 111, bookingId: "b" },
      ],
    });
  });
});

describe("hook afiliasi", () => {
  it("sesi Hadir memicu hitungan komisi; Tidak Hadir tidak", async () => {
    onSessionAttended.mockClear();
    const tx = createMockTx();
    await creditSessionRevenue(tx as unknown as Prisma.TransactionClient, { poolId: "p", coachProfileId: "c", bookingId: "b1", perSessionValue: 100000 });
    expect(onSessionAttended).toHaveBeenCalledWith(tx, "b1");
    onSessionAttended.mockClear();
    await creditSessionRevenue(tx as unknown as Prisma.TransactionClient, { poolId: "p", coachProfileId: "c", bookingId: "b2", perSessionValue: 100000, attended: false });
    expect(onSessionAttended).not.toHaveBeenCalled();
  });

  it("pembalikan sesi memberi tahu afiliasi", async () => {
    onSessionUnattended.mockClear();
    const tx = createMockTx();
    await reverseSessionRevenue(tx as unknown as Prisma.TransactionClient, { bookingId: "b1" });
    expect(onSessionUnattended).toHaveBeenCalledWith(tx, "b1");
  });
});

// Keputusan Hadi 29-30 Sep: contoh sesi Rp100.000 di kolam 10/40/50 -- kolam
// 50.000, coach 40.000, SPH 10.000 (PPN 11% sudah di dalamnya, bersih 9.009).
// Angka ini juga dicocokkan lewat UI + ledger di DB dev (sweep 30 Sep).
describe("bagi hasil 10/40/50 (contoh keputusan Hadi)", () => {
  const rows = async (perSessionValue: number, attended: boolean, pool = { commissionPercent: 10, coachSharePercent: 40 }) => {
    const tx = createMockTx({ pool });
    await creditSessionRevenue(tx, { poolId: "p", coachProfileId: "c", bookingId: "b", perSessionValue, attended });
    const data = (tx.walletTransaction.createMany as ReturnType<typeof vi.fn>).mock.calls[0][0].data as { type: string; amount: number }[];
    return Object.fromEntries(data.map((r) => [r.type, r.amount]));
  };

  it("Hadir Rp100.000: kolam 50.000, coach 40.000, SPH bersih 9.009 + PPN 991", async () => {
    expect(await rows(100_000, true)).toEqual({ SESSION_REVENUE: 50_000, SESSION_PAYOUT: 40_000, PLATFORM_REVENUE: 9_009, PLATFORM_TAX: 991 });
  });

  it("Tidak Hadir Rp100.000: coach 20.000 (50%), kolam Rp0, SPH 80.000 (bersih 72.072 + PPN 7.928)", async () => {
    expect(await rows(100_000, false)).toEqual({ SESSION_PAYOUT: 20_000, PLATFORM_REVENUE: 72_072, PLATFORM_TAX: 7_928 });
  });

  it("beli 1 sesi Rp120.000 (harga tertinggi 100.000 + markup 20%): kolam 60.000, coach 48.000, SPH 12.000", async () => {
    const r = await rows(120_000, true);
    expect(r.SESSION_REVENUE).toBe(60_000);
    expect(r.SESSION_PAYOUT).toBe(48_000);
    expect(r.PLATFORM_REVENUE + r.PLATFORM_TAX).toBe(12_000);
  });

  it("Tidak Hadir: jumlah semua baris = nilai sesi dan tidak ada yang negatif, di berbagai harga & persen", async () => {
    for (const v of [93_750, 100_000, 133_333, 7, 1, 999_999]) {
      for (const pool of [
        { commissionPercent: 10, coachSharePercent: 40 },
        { commissionPercent: 0, coachSharePercent: 100 },
        { commissionPercent: 0, coachSharePercent: 50 },
        { commissionPercent: 15, coachSharePercent: 55 },
      ]) {
        const r = await rows(v, false, pool);
        const sum = Object.values(r).reduce((a, b) => a + b, 0);
        expect({ v, pool, sum, negative: Object.values(r).some((x) => x < 0) }).toEqual({ v, pool, sum: v, negative: false });
        expect(r.SESSION_REVENUE).toBeUndefined();
      }
    }
  });
});
