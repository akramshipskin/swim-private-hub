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

  const availabilities = await prisma.availability.findMany({
    where: { date: dateLabel(date) },
    orderBy: [{ startTime: "asc" }],
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      coach: { select: { id: true, name: true } },
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
          coach: a.coach,
          bookedByMe,
          bookingId: bookedByMe ? activeBooking!.id : null,
          canCancel,
          cancelReason,
        };
      })
  );

  return Response.json({ availabilities: result });
}
