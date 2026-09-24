/**
 * Bersihkan akun demo (email @example.com -- domain khusus contoh, tidak
 * mungkin dipakai pengguna asli). Keputusan Hadi 25 Sep (Q6):
 *   - akun TANPA riwayat apa pun  -> dihapus
 *   - akun DENGAN riwayat (booking, paket, jadwal, saldo, pencairan,
 *     kepemilikan kolam)          -> dinonaktifkan + password diganti acak
 *     (+ coach: jadwal yang belum berjalan dibatalkan sebagai pembatalan admin)
 *
 * Default = HANYA MENAMPILKAN rencana, tidak mengubah apa pun. Tambah --apply
 * untuk benar-benar menjalankan.
 *
 * Jalankan (produksi):
 *   set -a && . ./.env.prod && set +a && \
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/cleanup-demo-accounts.mts          # lihat rencana
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/cleanup-demo-accounts.mts --apply  # jalankan
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const users = await prisma.user.findMany({
  where: { email: { endsWith: "@example.com", mode: "insensitive" } },
  select: {
    id: true, name: true, email: true, role: true, isActive: true,
    coachProfile: { select: { id: true, walletBalance: true, _count: { select: { walletTransactions: true, withdrawalRequests: true } } } },
    _count: { select: { bookings: true, packages: true, availabilities: true, poolOwnerships: true } },
  },
  orderBy: { email: "asc" },
});

const now = new Date();
console.log(`${users.length} akun demo ditemukan. Mode: ${apply ? "JALANKAN (--apply)" : "LIHAT SAJA (tanpa --apply)"}\n`);

for (const u of users) {
  const c = u._count;
  const history = {
    booking: c.bookings,
    paket: c.packages,
    jadwalCoach: c.availabilities,
    kolamDimiliki: c.poolOwnerships,
    catatanSaldo: u.coachProfile?._count.walletTransactions ?? 0,
    pencairan: u.coachProfile?._count.withdrawalRequests ?? 0,
  };
  const clean = Object.values(history).every((n) => n === 0) && (u.coachProfile?.walletBalance ?? 0) === 0;
  const upcoming =
    u.role === "COACH"
      ? await prisma.booking.findMany({
          where: { status: "BOOKED", attended: null, availability: { coachId: u.id, startTime: { gt: now } } },
          select: { id: true, member: { select: { name: true } }, availability: { select: { startTime: true } } },
        })
      : [];

  const riwayat = Object.entries(history).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join(", ") || "tidak ada";
  console.log(`- ${u.email} (${u.role}, ${u.isActive ? "aktif" : "nonaktif"}) riwayat: ${riwayat}`);
  if (upcoming.length) {
    console.log(`    ${upcoming.length} jadwal mendatang dengan member: ${upcoming.map((b) => `${b.member.name} ${b.availability.startTime.toISOString()}`).join("; ")}`);
  }
  console.log(`    rencana: ${clean ? "HAPUS akun" : "NONAKTIFKAN + ganti password"}${upcoming.length ? ` + batalkan ${upcoming.length} jadwal` : ""}`);

  if (!apply) continue;

  if (clean) {
    await prisma.user.delete({ where: { id: u.id } });
    console.log("    -> dihapus");
    continue;
  }
  await prisma.user.update({
    where: { id: u.id },
    data: { isActive: false, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10), sessionVersion: { increment: 1 } },
  });
  if (upcoming.length) {
    // Impor di sini saja: modul ini memakai alias @/ dan mengirim notifikasi
    // ke member (jadwalnya dibatalkan admin, sesi kembali).
    const { cancelBooking } = await import("../src/lib/cancel-booking");
    for (const b of upcoming) await cancelBooking({ bookingId: b.id, actor: { role: "ADMIN" } }).catch((e) => console.log(`    gagal batal ${b.id}: ${e.message}`));
  }
  console.log("    -> dinonaktifkan");
}

await prisma.$disconnect();
