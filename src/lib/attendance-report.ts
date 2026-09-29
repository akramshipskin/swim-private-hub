import { prisma } from "@/lib/prisma";
import { ATTENDANCE_REPORT_WINDOW_DAYS, memberCanReportAttendance } from "@/lib/policy";

// Laporan member atas status "Tidak Hadir" yang menurutnya salah (keputusan
// Hadi 29 Sep). Laporan TIDAK mengubah kehadiran atau uang: admin memeriksa,
// mengoreksi lewat toggle kehadiran biasa bila perlu (yang membalik dan
// mencatat ulang bagi hasil), lalu menutup laporan dengan catatan.

export class AttendanceReportError extends Error {}

export async function createAttendanceReport({
  memberId,
  bookingId,
  note,
  now = new Date(),
}: {
  memberId: string;
  bookingId: string;
  note: string;
  now?: Date;
}) {
  const text = note.trim();
  if (text.length > 500) throw new AttendanceReportError("Keterangan maksimal 500 karakter.");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { memberId: true, status: true, attended: true, availability: { select: { endTime: true } } },
  });
  // Booking orang lain diperlakukan sama dengan tidak ada (tidak bocor).
  if (!booking || booking.memberId !== memberId) throw new AttendanceReportError("Booking tidak ditemukan.");
  if (booking.status !== "BOOKED" || booking.attended !== false) {
    throw new AttendanceReportError("Hanya sesi berstatus Tidak Hadir yang bisa dilaporkan.");
  }
  if (!memberCanReportAttendance(booking.availability.endTime, now)) {
    throw new AttendanceReportError(
      `Batas melapor sudah lewat (${ATTENDANCE_REPORT_WINDOW_DAYS} hari setelah sesi). Hubungi admin lewat tombol bantuan.`
    );
  }

  try {
    return await prisma.attendanceReport.create({ data: { bookingId, memberId, note: text || null } });
  } catch (err) {
    // Satu laporan per booking (unique bookingId): kiriman kedua = sudah dilaporkan.
    if ((err as { code?: string })?.code === "P2002") {
      throw new AttendanceReportError("Sesi ini sudah dilaporkan dan sedang diperiksa admin.");
    }
    throw err;
  }
}

export async function resolveAttendanceReport({
  reportId,
  adminId,
  resolution,
}: {
  reportId: string;
  adminId: string;
  resolution: string;
}) {
  const text = resolution.trim();
  if (text.length < 3) throw new AttendanceReportError("Tulis hasil pemeriksaan (minimal 3 karakter).");
  if (text.length > 500) throw new AttendanceReportError("Hasil pemeriksaan maksimal 500 karakter.");
  // CAS: laporan yang sudah ditutup tidak ditimpa klik kedua.
  const claim = await prisma.attendanceReport.updateMany({
    where: { id: reportId, status: "OPEN" },
    data: { status: "RESOLVED", resolution: text, resolvedById: adminId, resolvedAt: new Date() },
  });
  if (claim.count === 0) throw new AttendanceReportError("Laporan ini sudah ditutup.");
}
