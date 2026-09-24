"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { wibDateTime, dateLabel, formatDateLabel, formatTimeWib } from "@/lib/datetime";
import { sendPushToUsers } from "@/lib/push";
import { usablePackageConditions } from "@/lib/active-package";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import { removeOpenSlots } from "@/lib/availability";

export type ActionState = { error?: string; warning?: string } | null;

export async function addAvailability(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireRole("COACH");

  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const poolId = formData.get("poolId") as string;

  if (!date || !startTime || !endTime || !poolId) {
    return { error: "Tanggal, jam mulai, jam selesai, dan kolam wajib diisi" };
  }
  // Tanpa ini, tanggal/jam ngaco jadi Invalid Date -> semua pengecekan
  // di bawah (dibandingin sama NaN) diem-diem false, 0 slot kebuat tapi
  // coach dapet "berhasil".
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { error: "Format tanggal atau jam tidak valid." };
  }

  // Coach cuma boleh buka slot di kolam yang dia terafiliasi -- dicek di
  // sini (bukan cuma dropdown UI) karena formData bisa dipalsu.
  const affiliated = await prisma.poolAffiliation.findUnique({
    where: { poolId_coachId: { poolId, coachId: session.user.id } },
    select: { pool: { select: { name: true } } },
  });
  if (!affiliated) {
    return { error: "Kamu tidak terafiliasi ke kolam ini." };
  }

  const startDateTime = wibDateTime(date, startTime);
  const endDateTime = wibDateTime(date, endTime);

  if (endDateTime <= startDateTime) {
    return { error: "Jam selesai harus setelah jam mulai" };
  }

  if (startDateTime < new Date()) {
    return { error: "Tidak bisa buat slot di tanggal/jam yang sudah lewat." };
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
      poolId,
      date: dateLabel(date),
      startTime: wibDateTime(date, `${pad(h)}:00`),
      endTime: wibDateTime(date, `${pad(h + 1)}:00`),
    });
  }
  if (chunks.length === 0) {
    return { error: "Tidak ada jam yang bisa dibuka di rentang ini (jam 12.00–13.00 adalah jam istirahat)." };
  }

  // Cek dulu jam-jam yang udah pernah dibuka -- kalau createMany langsung
  // dipanggil pakai skipDuplicates, request ini "berhasil" tanpa error
  // walau semua/sebagian jamnya kena skip diem-diem (unique constraint
  // [coachId, date, startTime]). Coach gak dapet feedback apa-apa dan
  // ngirain slotnya beneran ke-tambah.
  const conflicts = await prisma.availability.findMany({
    where: {
      coachId: session.user.id,
      date: dateLabel(date),
      startTime: { in: chunks.map((c) => c.startTime) },
    },
    select: { id: true, startTime: true, endTime: true, status: true, poolId: true, pool: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  // Slot yang dulu "dihapus" tapi cuma ditutup (punya riwayat booking, lihat
  // removeOpenSlots) di kolam yang sama -> dibuka ulang, bukan dianggap bentrok.
  // ponytail: yang tertutup di kolam LAIN tetap bentrok -- slotnya tidak bisa
  // dipindah kolam tanpa mengubah kolam di riwayat booking lamanya.
  const reopen = conflicts.filter((c) => c.status === "CLOSED" && c.poolId === poolId);
  if (reopen.length > 0) {
    await prisma.availability.updateMany({
      where: { id: { in: reopen.map((c) => c.id) }, status: "CLOSED" },
      data: { status: "AVAILABLE" },
    });
  }
  const blocked = conflicts.filter((c) => !reopen.includes(c));

  // Slot tertutup di kolam LAIN tidak kelihatan di daftar coach, jadi pesan
  // "hapus slot lamanya dulu" menyesatkan -- sebut kolamnya.
  const range = (c: { startTime: Date; endTime: Date }) => `${formatTimeWib(c.startTime)}–${formatTimeWib(c.endTime)}`;
  const closedElsewhere = blocked.filter((c) => c.status === "CLOSED");
  const visibleBlocked = blocked.filter((c) => c.status !== "CLOSED");
  const blockedNote = [
    visibleBlocked.length > 0 && `Jam ${visibleBlocked.map(range).join(", ")} sudah pernah dibuka sebelumnya.`,
    closedElsewhere.length > 0 &&
      `Jam ${closedElsewhere.map(range).join(", ")} sebelumnya dipakai di kolam ${[...new Set(closedElsewhere.map((c) => c.pool.name))].join(", ")} dan sudah ditutup; jam itu tidak bisa dipindah ke kolam lain (buka di kolam yang sama, atau pilih jam lain).`,
  ].filter(Boolean).join(" ");

  // Jam yang beneran bebas -- cuma ini yang boleh dibuat. Sebelumnya kalau
  // ADA satu jam aja yang bentrok, seluruh request diblokir total (termasuk
  // jam yang sebenernya bebas), jadi coach yang buka ulang rentang lebar
  // abis hapus 1-2 jam di tengahnya, kehilangan jam-jam yang harusnya
  // aman -- bug nyata yang ketauan pas dipake.
  const conflictTimes = new Set(conflicts.map((c) => c.startTime.getTime()));
  const blockedTimes = new Set(blocked.map((c) => c.startTime.getTime()));
  const freeChunks = chunks.filter((c) => !conflictTimes.has(c.startTime.getTime()));
  // Yang benar-benar jadi terbuka: dibuat baru + dibuka ulang.
  const openedChunks = chunks.filter((c) => !blockedTimes.has(c.startTime.getTime()));

  if (blocked.length > 0 && openedChunks.length === 0) {
    return {
      error: `${blockedNote}${visibleBlocked.length > 0 ? " Pilih jam lain atau hapus slot lamanya dulu." : ""}`,
    };
  }

  if (openedChunks.length > 0) {
    // skipDuplicates cuma jaring pengaman buat double-submit BENERAN
    // bersamaan (2 request keduanya lolos pre-check di atas sebelum
    // salah satu commit) -- pesan conflict yang udah ramah di atas
    // tetep jalan normal buat kasus biasa (submit ulang beberapa detik
    // kemudian), ini cuma nyegah 500 mentah (unique constraint violation)
    // buat sliver TOCTOU yang sangat jarang.
    if (freeChunks.length > 0) await prisma.availability.createMany({ data: freeChunks, skipDuplicates: true });

    // Broadcast 1 notif per aksi "Tambah Slot" (bukan per slot per jam)
    // biar member gak kebanjiran notif kalau coach buka rentang jam
    // panjang sekaligus. Cuma ke member yang punya paket aktif DI KOLAM
    // INI (paket cuma berlaku di kolam tempat dibeli) -- dulu ke semua
    // member di semua kolam. Best-effort: gagal kirim gak boleh gagalin slot
    // yang udah sukses tersimpan.
    const first = openedChunks[0];
    const last = openedChunks[openedChunks.length - 1];
    const rangeLabel =
      openedChunks.length === 1
        ? `${formatTimeWib(first.startTime)}–${formatTimeWib(first.endTime)}`
        : `${formatTimeWib(first.startTime)}–${formatTimeWib(last.endTime)}`;

    try {
      const members = await prisma.user.findMany({
        where: { role: "MEMBER", isActive: true, packages: { some: { ...usablePackageConditions(), poolId } } },
        select: { id: true },
      });
      await sendPushToUsers(
        members.map((m) => m.id),
        {
          title: "Slot jadwal baru",
          body: `${session.user.name}, ${affiliated.pool.name}, ${formatDateLabel(first.date)} ${rangeLabel}`,
          url: "/member/booking",
        }
      );
    } catch {
      // notifikasi bukan bagian dari penyimpanan slot
    }
  }

  revalidatePath("/coach/jadwal");

  if (blocked.length > 0) {
    return { warning: `${blockedNote} Jam itu dilewati, jam lainnya berhasil ditambahkan.` };
  }

  return null;
}

export async function deleteAvailability(availabilityId: string) {
  const session = await requireRole("COACH");

  // Slot boleh "dihapus" asal LAGI gak ada booking aktif. Yang pernah
  // dibooking (lalu batal) cuma ditutup, biar riwayat booking-nya tetap ada
  // (lihat removeOpenSlots).
  await removeOpenSlots({ id: availabilityId, coachId: session.user.id });

  revalidatePath("/coach/jadwal");
}

export type CancelBookingActionState = { error?: string } | null;

// Coach batalin sesi yang UDAH dibooking (sakit/emergency, dll) -- bypass
// window & jatah kuota mandiri member (lihat komentar cancelBooking),
// beda dari deleteAvailability yang cuma bisa hapus slot yang MASIH
// kosong. Sisa sesi member otomatis balik, coach dapet slotnya kembali
// AVAILABLE, member dapet notif.
export async function cancelBookingAsCoach(
  _prevState: CancelBookingActionState,
  formData: FormData
): Promise<CancelBookingActionState> {
  const session = await requireRole("COACH");

  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return { error: "Booking tidak ditemukan." };

  try {
    await cancelBooking({ bookingId, actor: { role: "COACH", coachId: session.user.id } });
  } catch (err) {
    if (err instanceof CancelError) return { error: err.message };
    throw err;
  }

  revalidatePath("/coach/jadwal");
  revalidatePath("/admin/booking-overview");
  return null;
}
