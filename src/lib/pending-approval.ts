import type { Prisma } from "@/generated/prisma/client";

// Pendaftar mandiri (coach / pemilik kolam) yang belum disetujui admin:
// nonaktif, belum pernah disetujui (approvedAt kosong), belum dihapus.
// Akun yang SENGAJA dinonaktifkan sudah punya approvedAt, jadi tidak ikut.
export const PENDING_APPROVAL_WHERE = {
  role: { in: ["COACH", "POOL_OWNER"] },
  isActive: false,
  approvedAt: null,
  anonymizedAt: null,
} satisfies Prisma.UserWhereInput;

type UserLike = { role: string; isActive: boolean; approvedAt: Date | null; anonymizedAt: Date | null };

export function isPendingApproval(u: UserLike): boolean {
  return (u.role === "COACH" || u.role === "POOL_OWNER") && !u.isActive && !u.approvedAt && !u.anonymizedAt;
}
