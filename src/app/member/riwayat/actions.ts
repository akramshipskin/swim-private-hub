"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { createAttendanceReport, AttendanceReportError } from "@/lib/attendance-report";
import { sendPushToRole } from "@/lib/push";
import { createCoachReport, CoachReportError } from "@/lib/coach-report";

export type ReportState = { error?: string; ok?: boolean } | null;

export async function reportAttendance(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const session = await requireRole("MEMBER");
  try {
    await createAttendanceReport({
      memberId: session.user.id,
      bookingId: formData.get("bookingId")?.toString() ?? "",
      note: formData.get("note")?.toString() ?? "",
    });
  } catch (err) {
    if (err instanceof AttendanceReportError) return { error: err.message };
    throw err;
  }
  await sendPushToRole("ADMIN", {
    title: "Laporan kehadiran baru",
    body: `${session.user.name ?? "Member"} melaporkan status Tidak Hadir yang menurutnya salah.`,
    url: "/admin/laporan-kehadiran",
  });
  revalidatePath("/member/riwayat");
  revalidatePath("/admin/laporan-kehadiran");
  return { ok: true };
}

// Lapor coach (Hadi 10-11 Okt): coach menawarkan les/kontak di luar aplikasi, dll.
export async function reportCoach(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const session = await requireRole("MEMBER");
  try {
    await createCoachReport({
      memberId: session.user.id,
      coachId: formData.get("coachId")?.toString() ?? "",
      message: formData.get("message")?.toString() ?? "",
      file: formData.get("attachment") as File | null,
    });
  } catch (err) {
    if (err instanceof CoachReportError) return { error: err.message };
    throw err;
  }
  await sendPushToRole("ADMIN", {
    title: "Laporan coach baru",
    body: `${session.user.name ?? "Member"} melaporkan coach. Cek di menu Laporan Coach.`,
    url: "/admin/laporan-coach",
  });
  revalidatePath("/admin/laporan-coach");
  return { ok: true };
}
