import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notify";
import { CANCEL_WINDOW_HOURS } from "@/lib/policy";
import { addDaysToDateString, dateLabel, formatDateWib, formatTimeWib } from "@/lib/datetime";

// Pemberitahuan terjadwal (Hadi 9 Okt): pengingat sebelum sesi dan paket mau
// berakhir. Tiap pemberitahuan diklaim dulu lewat kolom penanda (updateMany
// bersyarat), jadi pemeriksa yang jalan dua kali tidak mengirim dua kali.

const DAY = 86_400_000;
const wibDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

// "evening" = jam 18.00 WIB untuk sesi besok; "morning" = jam 06.00 WIB untuk
// sesi hari ini yang belum mulai. Sesi yang sudah dibatalkan tidak diingatkan.
export async function sendSessionReminders(kind: "evening" | "morning", now: Date = new Date()) {
  const target = kind === "evening" ? addDaysToDateString(wibDate(now), 1) : wibDate(now);
  const field = kind === "evening" ? "reminderEveningAt" : "reminderMorningAt";
  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      attended: null,
      [field]: null,
      member: { isActive: true, anonymizedAt: null },
      availability: { date: dateLabel(target), startTime: { gt: now } },
    },
    select: {
      id: true,
      memberId: true,
      package: { select: { dependent: { select: { name: true, isSelf: true } } } },
      availability: { select: { coachId: true, startTime: true, endTime: true, pool: { select: { name: true } }, coach: { select: { name: true } } } },
    },
    take: 1000,
  });
  let sent = 0;
  for (const b of bookings) {
    const claim = await prisma.booking.updateMany({ where: { id: b.id, status: "BOOKED", [field]: null }, data: { [field]: now } });
    if (claim.count === 0) continue;
    sent++;
    const a = b.availability;
    const jam = `${formatTimeWib(a.startTime)}–${formatTimeWib(a.endTime)}`;
    const when = kind === "evening" ? "besok" : "hari ini";
    const peserta = b.package.dependent.isSelf ? "kamu" : b.package.dependent.name;
    await notifyUser(
      b.memberId,
      `Pengingat sesi ${when} ${jam}`,
      `Sesi ${peserta} ${when} jam ${jam} di ${a.pool.name} dengan Coach ${a.coach.name}. Berhalangan? Batalkan paling lambat ${CANCEL_WINDOW_HOURS} jam sebelum jadwal di Riwayat Booking.`,
      "/member/riwayat",
    );
    await notifyUser(
      a.coachId,
      `Sesi ${when} ${jam}`,
      `${b.package.dependent.isSelf ? "Member" : b.package.dependent.name} di ${a.pool.name}, ${when} jam ${jam}.`,
      "/coach/jadwal",
    );
  }
  return sent;
}

// Paket aktif yang masih punya sesi belum dibooking: diberi tahu 14 hari dan
// 3 hari sebelum berakhir. Sesi coba (7 hari) hanya mendapat yang 3 hari.
export async function sendPackageExpiryNotices(now: Date = new Date()) {
  const pkgs = await prisma.package.findMany({
    where: {
      status: "ACTIVE",
      sisaSesi: { gt: 0 },
      refundedAt: null,
      expiredDate: { gt: now, lte: new Date(now.getTime() + 14 * DAY) },
      member: { isActive: true, anonymizedAt: null },
      OR: [{ expiryNotice3At: null }, { expiryNotice14At: null }],
    },
    select: { id: true, memberId: true, isTrial: true, sisaSesi: true, expiredDate: true, expiryNotice3At: true, expiryNotice14At: true, dependent: { select: { name: true, isSelf: true } } },
    take: 1000,
  });
  let sent = 0;
  for (const p of pkgs) {
    const soon = p.expiredDate!.getTime() - now.getTime() <= 3 * DAY;
    if (!soon && (p.isTrial || p.expiryNotice14At)) continue;
    if (soon && p.expiryNotice3At) continue;
    // Pemberitahuan 3 hari ikut menandai yang 14 hari, supaya tidak menyusul belakangan.
    const claim = await prisma.package.updateMany({
      where: { id: p.id, ...(soon ? { expiryNotice3At: null } : { expiryNotice14At: null }) },
      data: soon ? { expiryNotice3At: now, expiryNotice14At: p.expiryNotice14At ?? now } : { expiryNotice14At: now },
    });
    if (claim.count === 0) continue;
    sent++;
    const peserta = p.dependent.isSelf ? "kamu" : p.dependent.name;
    await notifyUser(
      p.memberId,
      soon ? "Paket berakhir dalam 3 hari" : "Paket berakhir dalam 2 minggu",
      `Paket ${peserta} berakhir ${formatDateWib(p.expiredDate!)} dan masih ada ${p.sisaSesi} sesi yang belum dibooking. Booking sekarang supaya sesinya tidak hangus.`,
      "/member/booking",
    );
  }
  return sent;
}
