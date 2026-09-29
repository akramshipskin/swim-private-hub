"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { createAttendanceReport, AttendanceReportError } from "@/lib/attendance-report";
import { sendPushToRole } from "@/lib/push";

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
