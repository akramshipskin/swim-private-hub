import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

// `db` opsional -- pass Prisma transaction client (`tx`) kalau manggil dari
// dalem $transaction biar atomic sama operasi laen (misal ganti password),
// default ke client global kalau berdiri sendiri.
type Db = typeof prisma | Prisma.TransactionClient;

export async function createDependent(memberId: string, name: string, db: Db = prisma) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Nama anak gak boleh kosong");
  return db.dependent.create({ data: { memberId, name: trimmed } });
}

// Peserta = "diri sendiri" (akun MEMBER-nya sendiri yang les, bukan anak).
// Nama-nya dicopy dari User.name pas dibuat. Paling banyak 1 per member --
// dicek di sini, bukan constraint DB (gak ada @@unique yang bisa nangkep
// "1 row true per memberId" secara native di Prisma/Postgres tanpa partial
// index manual).
export async function createSelfDependent(memberId: string, db: Db = prisma) {
  const existing = await db.dependent.findFirst({ where: { memberId, isSelf: true } });
  if (existing) return existing;

  const member = await db.user.findUniqueOrThrow({
    where: { id: memberId },
    select: { name: true },
  });
  return db.dependent.create({
    data: { memberId, name: member.name, isSelf: true },
  });
}

// IDOR guard -- dipake tiap kali packageId dateng dari client (booking,
// assign-paket) buat mastiin paket itu emang milik member yang lagi login,
// bukan cuma nurut ID yang dikirim di request.
export async function assertPackageOwnedByMember(packageId: string, memberId: string) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: { memberId: true },
  });
  if (!pkg || pkg.memberId !== memberId) {
    throw new Error("Paket gak ditemukan atau bukan milik kamu");
  }
}

export async function assertDependentOwnedByMember(dependentId: string, memberId: string) {
  const dep = await prisma.dependent.findUnique({
    where: { id: dependentId },
    select: { memberId: true },
  });
  if (!dep || dep.memberId !== memberId) {
    throw new Error("Anak gak ditemukan atau bukan punya kamu");
  }
}
