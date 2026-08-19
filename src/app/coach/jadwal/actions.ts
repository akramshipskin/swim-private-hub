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

  if (!date || !startTime || !endTime) {
    return { error: "Tanggal, jam mulai, dan jam selesai wajib diisi" };
  }

  const startDateTime = wibDateTime(date, startTime);
  const endDateTime = wibDateTime(date, endTime);

  if (endDateTime <= startDateTime) {
    return { error: "Jam selesai harus setelah jam mulai" };
  }

  if (startDateTime < new Date()) {
    return { error: "Gak bisa bikin slot di tanggal/jam yang udah lewat." };
  }

  // Slot selalu dipecah per jam bulat -- TimeSelect (hourOnly) udah
  // ngunci menit ke "00", jadi startH/endH pasti bilangan bulat.
  const [startH] = startTime.split(":").map(Number);
  const [endH] = endTime.split(":").map(Number);

  const chunks = [];
  for (let h = startH; h < endH; h++) {
    // Jam istirahat 12.00-13.00 default gak dijadiin slot booking.
    if (h === 12) continue;
    const pad = (n: number) => String(n).padStart(2, "0");
    chunks.push({
      coachId: session.user.id,
      date: dateLabel(date),
      startTime: wibDateTime(date, `${pad(h)}:00`),
      endTime: wibDateTime(date, `${pad(h + 1)}:00`),
    });
  }

  await prisma.availability.createMany({ data: chunks, skipDuplicates: true });

  emitBookingChanged();
  revalidatePath("/coach/jadwal");
  return null;
}

export async function deleteAvailability(availabilityId: string) {
  const session = await requireRole("COACH");

  // Slot boleh dihapus asal LAGI gak ada booking aktif (status
  // AVAILABLE) -- gak peduli riwayat booking/cancel sebelumnya (member
  // batal mandiri ataupun admin). Catatan: ini ngapus juga riwayat
  // Booking yang nempel di slot ini (Availability->Booking cascade),
  // jadi hitungan jatah cancel mandiri buat paket terkait bisa
  // kepengaruh sedikit -- trade-off yang disengaja biar coach bisa
  // beres-beres jadwal tanpa keganjel slot lama.
  await prisma.availability.deleteMany({
    where: {
      id: availabilityId,
      coachId: session.user.id,
      status: "AVAILABLE",
    },
  });

  emitBookingChanged();
  revalidatePath("/coach/jadwal");
}
