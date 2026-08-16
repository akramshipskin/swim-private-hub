"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { wibDateTime, dateLabel } from "@/lib/datetime";
import { emitBookingChanged } from "@/lib/booking-events";

export type ActionState = { error?: string } | null;

export async function addAvailability(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("COACH");

  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const splitHourly = formData.get("splitHourly") === "on";

  if (!date || !startTime || !endTime) {
    return { error: "Tanggal, jam mulai, dan jam selesai wajib diisi" };
  }

  const startDateTime = wibDateTime(date, startTime);
  const endDateTime = wibDateTime(date, endTime);

  if (endDateTime <= startDateTime) {
    return { error: "Jam selesai harus setelah jam mulai" };
  }

  if (!splitHourly) {
    try {
      await prisma.availability.create({
        data: {
          coachId: session.user.id,
          date: dateLabel(date),
          startTime: startDateTime,
          endTime: endDateTime,
        },
      });
    } catch {
      return { error: "Slot di jam ini udah ada sebelumnya." };
    }
  } else {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    if (startM !== 0 || endM !== 0) {
      return {
        error: "Pecah per jam cuma bisa buat jam bulat (misal 08:00, bukan 08:30).",
      };
    }

    const chunks = [];
    for (let h = startH; h < endH; h++) {
      const pad = (n: number) => String(n).padStart(2, "0");
      chunks.push({
        coachId: session.user.id,
        date: dateLabel(date),
        startTime: wibDateTime(date, `${pad(h)}:00`),
        endTime: wibDateTime(date, `${pad(h + 1)}:00`),
      });
    }

    await prisma.availability.createMany({ data: chunks, skipDuplicates: true });
  }

  emitBookingChanged();
  revalidatePath("/coach/jadwal");
  return null;
}

export async function deleteAvailability(availabilityId: string) {
  const session = await requireRole("COACH");

  // Cuma boleh hard-delete slot yang BENERAN belum pernah kesentuh
  // booking (bahkan yang udah dibatalin). Availability->Booking pake
  // onDelete: Cascade -- kalau slot yang PERNAH dibooking-lalu-dibatalin
  // dihapus, riwayat cancel-nya ikut lenyap, padahal riwayat itu yang
  // dipakai ngitung jatah pembatalan mandiri member. Ngapus riwayat itu
  // diam-diam nge-reset jatah cancel member.
  await prisma.availability.deleteMany({
    where: {
      id: availabilityId,
      coachId: session.user.id,
      status: "AVAILABLE",
      bookings: { none: {} },
    },
  });

  emitBookingChanged();
  revalidatePath("/coach/jadwal");
}
