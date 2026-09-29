import { prisma } from "@/lib/prisma";

// Aturan yang HARUS benar setiap kali sebuah operasi (atau sekumpulan operasi
// barengan) selesai. Dipanggil di akhir tes race BARU:
//
//   expect(await checkInvariants()).toEqual([]);
//
// Mengembalikan daftar pelanggaran (kosong = aman), bukan langsung throw,
// supaya pesan gagalnya menyebut persis aturan mana yang rusak.
//
// Opsi (matikan HANYA kalau tes memang sengaja mengubahnya, dan tulis alasannya
// di komentar tes):
//  - packages: cek "sisa sesi + booking aktif = total sesi". Matikan kalau tes
//    ini mengedit sisa sesi lewat menu admin, atau membuat paket dengan sisa
//    yang bukan total.
//  - ledger:   cek "saldo (cache) = jumlah pembukuan". Matikan kalau tes ini
//    mengisi saldo awal langsung (mkPool({ balance }), mkUser(..., { coachBalance }))
//    tanpa baris pembukuan.
export async function checkInvariants(opts: { packages?: boolean; ledger?: boolean } = {}): Promise<string[]> {
  const { packages = true, ledger = true } = opts;
  const bad: string[] = [];

  // 1. Slot dan booking harus sepakat: slot BOOKED punya tepat 1 booking aktif,
  //    slot AVAILABLE tidak punya booking aktif.
  const slots = await prisma.availability.findMany({
    select: { id: true, status: true, bookings: { where: { status: "BOOKED" }, select: { id: true } } },
  });
  for (const s of slots) {
    const n = s.bookings.length;
    if (s.status === "BOOKED" && n !== 1) bad.push(`slot ${s.id} berstatus BOOKED tapi punya ${n} booking aktif`);
    if (s.status === "AVAILABLE" && n !== 0) bad.push(`slot ${s.id} berstatus AVAILABLE tapi punya ${n} booking aktif`);
    if (s.status === "CLOSED" && n !== 0) bad.push(`slot ${s.id} ditutup tapi punya ${n} booking aktif`);
  }

  // 2. Paket: sisa sesi tidak pernah negatif atau melebihi total; dan (opsional)
  //    sisa + booking aktif = total.
  const pkgs = await prisma.package.findMany({
    select: { id: true, totalSesi: true, sisaSesi: true, bookings: { where: { status: "BOOKED" }, select: { id: true } } },
  });
  for (const p of pkgs) {
    if (p.sisaSesi < 0) bad.push(`paket ${p.id} sisa sesi negatif (${p.sisaSesi})`);
    if (p.sisaSesi > p.totalSesi) bad.push(`paket ${p.id} sisa sesi ${p.sisaSesi} melebihi total ${p.totalSesi}`);
    if (packages && p.sisaSesi + p.bookings.length !== p.totalSesi) {
      bad.push(`paket ${p.id}: sisa ${p.sisaSesi} + booking aktif ${p.bookings.length} != total ${p.totalSesi}`);
    }
  }

  // 3. Saldo kolam & coach sama dengan jumlah pembukuan (WalletTransaction).
  //    Saldo BOLEH negatif sejak keputusan Hadi 29 Sep (Hadir dibatalkan
  //    setelah dicairkan); yang dijaga pencairan tidak melebihi saldo.
  const sumFor = async (where: { poolId: string } | { coachProfileId: string }) =>
    (await prisma.walletTransaction.aggregate({ where, _sum: { amount: true } }))._sum.amount ?? 0;
  for (const pool of await prisma.pool.findMany({ select: { id: true, walletBalance: true } })) {
    if (ledger) {
      const l = await sumFor({ poolId: pool.id });
      if (l !== pool.walletBalance) bad.push(`saldo kolam ${pool.id} ${pool.walletBalance} != pembukuan ${l}`);
    }
  }
  for (const c of await prisma.coachProfile.findMany({ select: { id: true, walletBalance: true } })) {
    if (ledger) {
      const l = await sumFor({ coachProfileId: c.id });
      if (l !== c.walletBalance) bad.push(`saldo coach ${c.id} ${c.walletBalance} != pembukuan ${l}`);
    }
  }

  // 4. Platform tidak pernah menarik lebih dari pendapatan yang pernah masuk.
  // Saldonya sendiri BOLEH minus (keputusan Hadi 29 Sep, Q-d & Q-e): komisi
  // afiliasi dibayar di muka dari bagian SPH, dan pembalikan Hadir tetap
  // dicatat walau uang sesi itu sudah ditarik. Minus ditutup sesi berikutnya;
  // selama minus, penarikan ditolak (platform-wallet.ts).
  const credited = await prisma.walletTransaction.groupBy({ by: ["type"], where: { type: { in: ["PLATFORM_REVENUE", "PLATFORM_TAX"] }, amount: { gt: 0 } }, _sum: { amount: true } });
  const wd = await prisma.platformWithdrawal.aggregate({ _sum: { revenueAmount: true, taxAmount: true } });
  const inRevenue = credited.find((x) => x.type === "PLATFORM_REVENUE")?._sum.amount ?? 0;
  const inTax = credited.find((x) => x.type === "PLATFORM_TAX")?._sum.amount ?? 0;
  if ((wd._sum.revenueAmount ?? 0) > inRevenue) bad.push(`penarikan pendapatan platform ${wd._sum.revenueAmount} > pendapatan yang pernah masuk ${inRevenue}`);
  if ((wd._sum.taxAmount ?? 0) > inTax) bad.push(`penarikan pajak platform ${wd._sum.taxAmount} > pajak yang pernah masuk ${inTax}`);

  return bad;
}
