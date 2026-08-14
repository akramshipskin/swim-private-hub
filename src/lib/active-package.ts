import { Prisma } from "@/generated/prisma/client";

// Kondisi "paket aktif & bisa dipake buat booking" -- satu sumber
// kebenaran, dipake di query booking (enforce) DAN di tampilan member
// (biar gak nyimpang: kalau di sini bilang aktif, booking pasti lolos).
export function activePackageWhere(memberId: string): Prisma.PackageWhereInput {
  return {
    memberId,
    status: "ACTIVE",
    sisaSesi: { gt: 0 },
    OR: [{ expiredDate: null }, { expiredDate: { gte: new Date() } }],
  };
}
