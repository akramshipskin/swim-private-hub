"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { resolveCoachReport, CoachReportError } from "@/lib/coach-report";

export type ResolveState = { error?: string; ok?: boolean } | null;

export async function resolveCoachReportAction(_prev: ResolveState, formData: FormData): Promise<ResolveState> {
  const session = await requireRole("ADMIN");
  try {
    await resolveCoachReport({
      reportId: formData.get("reportId")?.toString() ?? "",
      adminId: session.user.id,
      resolution: formData.get("resolution")?.toString() ?? "",
    });
  } catch (err) {
    if (err instanceof CoachReportError) return { error: err.message };
    throw err;
  }
  revalidatePath("/admin/laporan-coach");
  revalidatePath("/admin");
  return { ok: true };
}
