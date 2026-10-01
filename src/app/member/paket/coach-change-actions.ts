"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { notifyAdmins } from "@/lib/notify";
import { cancelCoachChange, submitCoachChange } from "@/lib/coach-change-actions-core";

export type CoachChangeState = { error?: string; ok?: boolean } | null;

export async function requestCoachChange(_prev: CoachChangeState, formData: FormData): Promise<CoachChangeState> {
  const session = await requireRole("MEMBER");
  const res = await submitCoachChange(session.user.id, {
    packageId: formData.get("packageId")?.toString() ?? "",
    toCoachId: formData.get("toCoachId")?.toString() ?? "",
    reason: formData.get("reason")?.toString() ?? "",
  });
  if ("error" in res) return res;
  await notifyAdmins("Pengajuan ganti coach", `${session.user.name ?? "Member"} mengajukan ganti coach`, "/admin/ganti-coach");
  revalidatePath("/member/paket");
  revalidatePath("/admin/ganti-coach");
  return { ok: true };
}

export async function withdrawCoachChange(formData: FormData) {
  const session = await requireRole("MEMBER");
  await cancelCoachChange(session.user.id, formData.get("requestId")?.toString() ?? "");
  revalidatePath("/member/paket");
  revalidatePath("/admin/ganti-coach");
}
