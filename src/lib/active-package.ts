import { Prisma } from "@/generated/prisma/client";

// Kondisi "paket beneran bisa dipake" -- status ACTIVE doang gak cukup,
// paket bisa kehabisan sesi atau kedaluwarsa tapi status-nya di DB tetep
// "ACTIVE" selamanya (gak ada cron yang nge-flip ke EXPIRED otomatis).
// Satu sumber kebenaran, dipake di query booking (enforce) DAN di semua
// tampilan (member, admin) -- biar gak nyimpang: kalau di sini bilang
// aktif, booking pasti lolos.
export const usablePackageConditions: Prisma.PackageWhereInput = {
  status: "ACTIVE",
  sisaSesi: { gt: 0 },
  OR: [{ expiredDate: null }, { expiredDate: { gte: new Date() } }],
};

export function activePackageWhere(memberId: string): Prisma.PackageWhereInput {
  return { memberId, ...usablePackageConditions };
}

// Sama kayak activePackageWhere, tapi discope ke 1 anak spesifik --
// 1 paket = 1 anak, jadi gak ada FIFO lintas-anak lagi, tiap anak punya
// "paket aktif"-nya sendiri.
export function activePackageWhereForDependent(
  memberId: string,
  dependentId: string
): Prisma.PackageWhereInput {
  return { ...activePackageWhere(memberId), dependentId };
}
