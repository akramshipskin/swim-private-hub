import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import BookingOverviewBoard from "./booking-overview-board";

export default async function AdminBookingOverviewPage() {
  await requireRole("ADMIN");

  // Root di Availability (bukan Booking) biar slot yang UDAH dibuka coach
  // tapi BELUM ada member yang ambil juga keliatan -- admin bisa langsung
  // tau coach mana yang jamnya masih kosong.
  //
  // Semua coach diambil sekaligus (gak difilter server-side per coachId
  // lagi) -- filter coach sekarang murni di client (BookingOverviewBoard),
  // biar ganti pilihan coach di dropdown instant tanpa round-trip ke
  // server/DB.
  const [availabilities, allCoaches] = await Promise.all([
    prisma.availability.findMany({
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      include: {
        coach: { select: { id: true, name: true } },
        pool: { select: { name: true } },
        bookings: {
          where: { status: "BOOKED" },
          include: {
            member: { select: { name: true, email: true } },
            package: { select: { dependent: { select: { name: true, isSelf: true } } } },
          },
          take: 1,
        },
      },
    }),
    prisma.user.findMany({
      where: { role: "COACH" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="w-full px-4 py-6 sm:py-8">
      <BookingOverviewBoard availabilities={availabilities} coaches={allCoaches} />
    </main>
  );
}
