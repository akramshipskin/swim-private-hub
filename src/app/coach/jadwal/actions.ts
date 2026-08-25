"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { wibDateTime, dateLabel, formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { sendPushToUser } from "@/lib/push";

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

  if (chunks.length > 0) {
    // Broadcast 1 notif per aksi "Tambah Slot" (bukan per slot per jam)
    // biar member gak kebanjiran notif kalau coach buka rentang jam
    // panjang sekaligus. Best-effort, gak boleh gagalin slot yang udah
    // sukses tersimpan.
    const first = chunks[0];
    const last = chunks[chunks.length - 1];
    const rangeLabel =
      chunks.length === 1
        ? `${formatTimeWib(first.startTime)}–${formatTimeWib(first.endTime)}`
        : `${formatTimeWib(first.startTime)}–${formatTimeWib(last.endTime)}`;

    prisma.user
      .findMany({ where: { role: "MEMBER", isActive: true }, select: { id: true } })
      .then((members) =>
        Promise.allSettled(
          members.map((m) =>
            sendPushToUser(m.id, {
              title: "Slot jadwal baru",
              body: `${session.user.name}, ${formatDateLabel(first.startTime)} ${rangeLabel}`,
              url: "/member/booking",
            })
          )
        )
      )
      .catch(() => {});
  }

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

  revalidatePath("/coach/jadwal");
}
