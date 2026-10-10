import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NOT_CLOSED } from "@/lib/availability";
import { withinPoolHours } from "@/lib/pool-hours";
import { fullPoolDays, isFullDay } from "@/lib/coach-open-slots";
import { dateLabel, todayWibDateString } from "@/lib/datetime";
import { checkCancelEligibility } from "@/lib/cancel-eligibility";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status: 401 });
  }
  // Hanya member (yang booking) dan admin. Pemilik kolam dan coach tidak
  // melihat jadwal dan kepadatan kolam lain lewat sini (Hadi 11 Okt, T14);
  // jadwal kolam sendiri ada di halaman Jadwal Kolam.
  if (session.user.role !== "MEMBER" && session.user.role !== "ADMIN") {
    return Response.json({ error: "Kamu tidak punya akses ke fitur ini." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayWibDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateLabel(date).getTime())) {
    return Response.json({ error: "Tanggal tidak valid. Pilih ulang tanggalnya." }, { status: 400 });
  }
  // Pool-first browse (locked /plan-eng-review 2026-09-12): member
  // selalu tau kolamnya lewat paket/anak yang dipilih. poolId dibiarin
  // opsional (bukan wajib) di level API supaya endpoint ini tetep aman
  // dipanggil tanpa filter kalau ada pemanggil lain di masa depan yang
  // beneran butuh lintas-kolam -- tapi UI member saat ini SELALU
  // ngirim poolId.
  const poolId = searchParams.get("poolId") ?? undefined;

  const availabilities = await prisma.availability.findMany({
    // Slot coach yang dinonaktifkan admin atau di kolam nonaktif tidak ditampilkan (tidak bisa dibooking).
    where: { date: dateLabel(date), coach: { isActive: true }, pool: { isActive: true }, ...NOT_CLOSED, ...(poolId ? { poolId } : {}) },
    orderBy: [{ startTime: "asc" }],
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      poolId: true,
      date: true,
      pool: { select: { openTime: true, closeTime: true, dailyCapacity: true } },
      coach: { select: { id: true, name: true, coachProfile: { select: { photoUrl: true } } } },
      // Availability bisa punya banyak Booking historis (pernah
      // dibatalkan lalu dibooking lagi) -- yang relevan buat status
      // slot cuma yang masih BOOKED (paling banyak 1, dijamin partial
      // unique index di DB).
      bookings: {
        where: { status: "BOOKED" },
        select: {
          id: true,
          memberId: true,
          packageId: true,
          status: true,
          package: { select: { dependent: { select: { name: true, isSelf: true } } } },
        },
        take: 1,
      },
    },
  });

  const now = new Date();
  // Slot kosong di tanggal yang kapasitas harian kolamnya sudah penuh pasti ditolak saat booking.
  const full = await fullPoolDays(availabilities.filter((a) => a.bookings.length === 0));

  const result = await Promise.all(
    availabilities
      // Slot kosong (belum ada yang book) yang jamnya udah lewat gak
      // relevan lagi buat member -- hide total. Slot yang UDAH dibooking
      // tetep ditampilin (biar member masih liat booking-nya sendiri).
      // Slot kosong di luar jam buka kolam pasti ditolak saat booking: tidak ditampilkan.
      .filter((a) => a.bookings.length > 0 || (a.startTime > now && withinPoolHours(a.pool, a.startTime, a.endTime) && !isFullDay(full, a)))
      .map(async (a) => {
        const activeBooking = a.bookings[0];
        const bookedByMe = activeBooking?.memberId === session.user.id;

        let canCancel = false;
        let cancelReason: string | undefined;

        if (bookedByMe && activeBooking) {
          const eligibility = await checkCancelEligibility({
            memberId: activeBooking.memberId,
            packageId: activeBooking.packageId,
            startTime: a.startTime,
          });
          canCancel = eligibility.canCancel;
          cancelReason = eligibility.reason;
        }

        return {
          id: a.id,
          startTime: a.startTime,
          endTime: a.endTime,
          status: a.status,
          coach: { id: a.coach.id, name: a.coach.name, photoUrl: a.coach.coachProfile?.photoUrl ?? null },
          bookedByMe,
          bookingId: bookedByMe ? activeBooking!.id : null,
          bookedForChildName:
            bookedByMe && activeBooking
              ? activeBooking.package.dependent.isSelf
                ? "kamu sendiri"
                : activeBooking.package.dependent.name
              : null,
          canCancel,
          cancelReason,
        };
      })
  );

  return Response.json({ availabilities: result });
}
