"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { resolveAttendanceReport, AttendanceReportError } from "@/lib/attendance-report";

export type ResolveState = { error?: string; ok?: boolean } | null;

export async function resolveReport(_prev: ResolveState, formData: FormData): Promise<ResolveState> {
  const session = await requireRole("ADMIN");
  try {
    await resolveAttendanceReport({
      reportId: formData.get("reportId")?.toString() ?? "",
      adminId: session.user.id,
      resolution: formData.get("resolution")?.toString() ?? "",
    });
  } catch (err) {
    if (err instanceof AttendanceReportError) return { error: err.message };
    throw err;
  }
  revalidatePath("/admin/laporan-kehadiran");
  revalidatePath("/member/riwayat");
  return { ok: true };
}
