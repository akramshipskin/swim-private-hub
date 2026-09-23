import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dateLabel, todayWibDateString } from "@/lib/datetime";
import { checkCancelEligibility } from "@/lib/cancel-eligibility";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayWibDateString();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateLabel(date).getTime())) {
    return Response.json({ error: "Format tanggal harus YYYY-MM-DD" }, { status: 400 });
  }
  // Pool-first browse (locked /plan-eng-review 2026-09-12): member
  // selalu tau kolamnya lewat paket/anak yang dipilih. poolId dibiarin
  // opsional (bukan wajib) di level API supaya endpoint ini tetep aman
  // dipanggil tanpa filter kalau ada pemanggil lain di masa depan yang
  // beneran butuh lintas-kolam -- tapi UI member saat ini SELALU
  // ngirim poolId.
  const poolId = searchParams.get("poolId") ?? undefined;

  const availabilities = await prisma.availability.findMany({
    where: { date: dateLabel(date), ...(poolId ? { poolId } : {}) },
    orderBy: [{ startTime: "asc" }],
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
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

  const result = await Promise.all(
    availabilities
      // Slot kosong (belum ada yang book) yang jamnya udah lewat gak
      // relevan lagi buat member -- hide total. Slot yang UDAH dibooking
      // tetep ditampilin (biar member masih liat booking-nya sendiri).
      .filter((a) => a.bookings.length > 0 || a.startTime > now)
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
