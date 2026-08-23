import { prisma } from "@/lib/prisma";
import { toProperCase } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

// `db` opsional -- pass Prisma transaction client (`tx`) kalau manggil dari
// dalem $transaction biar atomic sama operasi laen (misal ganti password),
// default ke client global kalau berdiri sendiri.
type Db = typeof prisma | Prisma.TransactionClient;

export async function createDependent(memberId: string, name: string, db: Db = prisma) {
  const trimmed = toProperCase(name.trim());
  if (!trimmed) throw new Error("Nama anak gak boleh kosong");
  return db.dependent.create({ data: { memberId, name: trimmed } });
}

// Peserta = "diri sendiri" (akun MEMBER-nya sendiri yang les, bukan anak).
// Nama-nya dicopy dari User.name pas dibuat. Paling banyak 1 per member --
// gak ada @@unique yang bisa nangkep "1 row true per memberId" native di
// Prisma/Postgres tanpa partial index manual, jadi dijamin lewat row lock
// (FOR UPDATE) di User biar check-then-create-nya atomic -- 2 submit
// bersamaan (misal double-klik) antre satu-satu, gak dobel-create.
async function createSelfDependentLocked(memberId: string, tx: Db) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${memberId} FOR UPDATE`;

  const existing = await tx.dependent.findFirst({ where: { memberId, isSelf: true } });
  if (existing) return existing;

  const member = await tx.user.findUniqueOrThrow({
    where: { id: memberId },
    select: { name: true },
  });
  return tx.dependent.create({
    data: { memberId, name: member.name, isSelf: true },
  });
}

export async function createSelfDependent(memberId: string, db: Db = prisma) {
  // `FOR UPDATE` cuma efektif kalau lock-nya ditahan sepanjang
  // check-then-create -- kalau `db` itu prisma polos (bukan tx caller),
  // bungkus transaksi sendiri di sini. Kalau caller udah dalem transaksi
  // (`db` = tx), jalanin langsung di situ biar tetep 1 transaksi yang sama.
  return db === prisma
    ? prisma.$transaction((tx) => createSelfDependentLocked(memberId, tx))
    : createSelfDependentLocked(memberId, db);
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
