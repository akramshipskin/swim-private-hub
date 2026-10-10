import { prisma } from "@/lib/prisma";
import { CERT_BUCKET, extensionFor, hasMatchingSignature, isStorageConfigured, SIGNATURE_MISMATCH_ERROR, uploadObject, validateUpload } from "@/lib/storage";
import { takeAttempt } from "@/lib/rate-limit";

// Laporan member atas coach (Hadi 10-11 Okt): contoh coach menawarkan les atau
// kontak di luar aplikasi. Bukti untuk daftar hitam pasal 6; diperiksa admin.
export class CoachReportError extends Error {}

export const MAX_REPORT_LENGTH = 1000;
const REPORTS_PER_DAY = 5;

export async function createCoachReport({ memberId, coachId, message, file }: { memberId: string; coachId: string; message: string; file: File | null }) {
  const text = message.trim();
  if (text.length < 10) throw new CoachReportError("Ceritakan kejadiannya (minimal 10 karakter).");
  if (text.length > MAX_REPORT_LENGTH) throw new CoachReportError(`Laporan maksimal ${MAX_REPORT_LENGTH} karakter.`);
  // Hanya coach yang pernah punya booking dengan member ini.
  const booking = await prisma.booking.findFirst({
    where: { memberId, availability: { coachId } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!booking) throw new CoachReportError("Pilih coach yang pernah melatih pesertamu.");
  const hasFile = !!file && file.size > 0;
  if (hasFile) {
    const invalid = validateUpload(file, "photo");
    if (invalid) throw new CoachReportError(invalid.replace("Foto", "Tangkapan layar"));
    if (!(await hasMatchingSignature(file!))) throw new CoachReportError(SIGNATURE_MISMATCH_ERROR);
    if (!isStorageConfigured()) throw new CoachReportError("Unggah file belum diaktifkan. Kirim laporan tanpa lampiran.");
  }
  if (!(await takeAttempt(`coach-report:${memberId}`, REPORTS_PER_DAY, 86_400_000))) {
    throw new CoachReportError("Batas laporan hari ini tercapai. Hubungi admin lewat WhatsApp bila mendesak.");
  }
  let attachmentPath: string | null = null;
  if (hasFile) {
    attachmentPath = `reports/${memberId}/${Date.now()}.${extensionFor(file!)}`;
    await uploadObject(CERT_BUCKET, attachmentPath, file!);
  }
  return prisma.coachReport.create({ data: { reporterId: memberId, coachId, bookingId: booking.id, message: text, attachmentPath } });
}

export async function resolveCoachReport({ reportId, adminId, resolution }: { reportId: string; adminId: string; resolution: string }) {
  const text = resolution.trim();
  if (text.length < 3) throw new CoachReportError("Tulis hasil pemeriksaan.");
  if (text.length > 500) throw new CoachReportError("Hasil pemeriksaan maksimal 500 karakter.");
  const res = await prisma.coachReport.updateMany({
    where: { id: reportId, status: "OPEN" },
    data: { status: "RESOLVED", resolution: text, resolvedById: adminId, resolvedAt: new Date() },
  });
  if (res.count === 0) throw new CoachReportError("Laporan ini sudah ditutup. Muat ulang halaman.");
}
