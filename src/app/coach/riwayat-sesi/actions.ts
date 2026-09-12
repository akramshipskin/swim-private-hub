"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { payoutCoachForSession, reverseCoachPayoutForSession } from "@/lib/wallet";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = { error?: string } | null;

// Coach & admin bisa nandain hadir/gak hadir di booking yang UDAH ADA
// (lewat jam sesinya). Ini cuma toggle status, gak ada jalur buat coach
// bikin booking/sesi baru sendiri -- biar aman dari coach nge-klaim sesi
// yang gak beneran kejadian.
export async function markAttendance(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "COACH" && session.user.role !== "ADMIN") {
    return { error: "Gak punya akses." };
  }

  const bookingId = formData.get("bookingId") as string;
  const attended = formData.get("attended") === "true";

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      availability: { include: { coach: { include: { coachProfile: true } } } },
      package: { include: { payments: { where: { status: "SUCCESS" }, take: 1 } } },
    },
  });

  if (!booking || booking.status !== "BOOKED") {
    return { error: "Booking gak ditemukan atau udah dibatalin." };
  }
  if (session.user.role === "COACH" && booking.availability.coachId !== session.user.id) {
    return { error: "Bukan sesi kamu." };
  }
  if (booking.availability.endTime > new Date()) {
    return { error: "Belum waktunya, sesi ini belum selesai." };
  }

  const wasAttended = booking.attended === true;

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        attended,
        attendedBy: session.user.role as "COACH" | "ADMIN",
        attendedAt: new Date(),
      },
    });

    // Payout cuma jalan kalau paket ini beneran dibeli lewat Midtrans
    // (ada Payment SUCCESS) -- paket yang di-assign manual/gratis sama
    // admin gak punya uang beneran buat dibagi, jadi gak ada transaksi
    // wallet. coachProfile null (coach gak sengaja punya profile, harusnya
    // gak mungkin tapi dicek jaga-jaga) juga skip.
    const successPayment = booking.package.payments[0];
    const coachProfile = booking.availability.coach.coachProfile;
    if (!successPayment || !coachProfile) return;

    const perSessionValue = Math.round(successPayment.amount / booking.package.totalSesi);

    if (!wasAttended && attended) {
      await payoutCoachForSession(tx, {
        poolId: booking.package.poolId,
        coachProfileId: coachProfile.id,
        bookingId,
        perSessionValue,
      });
    } else if (wasAttended && !attended) {
      await reverseCoachPayoutForSession(tx, { bookingId });
    }
  });

  revalidatePath("/coach/riwayat-sesi");
  revalidatePath("/coach/saldo");
  revalidatePath("/admin/booking-overview");
  return null;
}
