import { Prisma } from "@/generated/prisma/client";

// Kondisi "paket beneran bisa dipake" -- status ACTIVE doang gak cukup,
// paket bisa kehabisan sesi atau kedaluwarsa tapi status-nya di DB tetep
// "ACTIVE" selamanya (gak ada cron yang nge-flip ke EXPIRED otomatis).
// Satu sumber kebenaran, dipake di query booking (enforce) DAN di semua
// tampilan (member, admin) -- biar gak nyimpang: kalau di sini bilang
// aktif, booking pasti lolos.
//
// Function, bukan konstanta -- `new Date()` di konstanta level modul cuma
// kejalan SEKALI pas modul di-load, jadi di instance server yang idup lama
// (warm Vercel function) "sekarang"-nya kebeku di jam server nyala: paket
// yang expired setelah itu masih dianggap aktif & masih bisa dibooking.
export function usablePackageConditions(): Prisma.PackageWhereInput {
  return {
    status: "ACTIVE",
    sisaSesi: { gt: 0 },
    OR: [{ expiredDate: null }, { expiredDate: { gte: new Date() } }],
  };
}

export function activePackageWhere(memberId: string): Prisma.PackageWhereInput {
  return { memberId, ...usablePackageConditions() };
}
