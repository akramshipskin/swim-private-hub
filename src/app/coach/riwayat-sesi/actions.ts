"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
    include: { availability: true },
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

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      attended,
      attendedBy: session.user.role,
      attendedAt: new Date(),
    },
  });

  revalidatePath("/coach/riwayat-sesi");
  revalidatePath("/admin/booking-overview");
  return null;
}
