import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

// "Hapus" slot kosong (keputusan Hadi 25 Sep): slot yang BELUM pernah
// dibooking benar-benar dihapus; slot yang pernah dibooking (lalu batal)
// cuma DITUTUP -- disembunyikan & tidak bisa dibooking, tapi riwayat
// booking-nya tetap ada (dulu ikut terhapus lewat cascade Availability->Booking).
//
// Keduanya mensyaratkan status AVAILABLE di WHERE yang sama dengan
// perubahannya, jadi booking yang masuk bersamaan (klaim AVAILABLE->BOOKED di
// /api/booking) tidak pernah ikut terhapus/tertutup.
export async function removeOpenSlots(where: Prisma.AvailabilityWhereInput, db: Db = prisma) {
  const open = { AND: [where, { status: "AVAILABLE" as const }] };
  const deleted = await db.availability.deleteMany({ where: { AND: [open, { bookings: { none: {} } }] } });
  const closed = await db.availability.updateMany({ where: open, data: { status: "CLOSED" } });
  return { deleted: deleted.count, closed: closed.count };
}

// Filter untuk semua daftar slot: slot tertutup tidak pernah ditampilkan.
export const NOT_CLOSED = { status: { not: "CLOSED" as const } };
