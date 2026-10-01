"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { approveCoachChange, rejectCoachChange } from "@/lib/coach-change-actions-core";
import { notifyCoachChangeResult } from "@/lib/coach-change";
import { notifyUser } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/format";
import { userErrorMessage } from "@/lib/user-error";

export type DecideState = { error?: string; ok?: boolean } | null;

function refresh() {
  revalidatePath("/admin/ganti-coach");
  revalidatePath("/member/paket");
}

export async function approveAction(_prev: DecideState, formData: FormData): Promise<DecideState> {
  await requireRole("ADMIN");
  const requestId = formData.get("requestId")?.toString() ?? "";
  let res;
  try {
    res = await approveCoachChange(requestId);
  } catch (err) {
    return { error: userErrorMessage(err, "Gagal menyetujui.") };
  }
  if ("error" in res) return res;
  if (res.status === "COMPLETED") await notifyCoachChangeResult(requestId, "completed").catch(() => {});
  else {
    const req = await prisma.coachChangeRequest.findUnique({ where: { id: requestId }, select: { memberId: true, amount: true } });
    if (req) {
      await notifyUser(
        req.memberId,
        "Ganti coach disetujui",
        `Tambah bayar ${formatRupiah(req.amount ?? 0)} paling lambat 24 jam supaya ganti coach berlaku.`,
        "/member/paket"
      );
    }
  }
  refresh();
  return { ok: true };
}

export async function rejectAction(_prev: DecideState, formData: FormData): Promise<DecideState> {
  await requireRole("ADMIN");
  const requestId = formData.get("requestId")?.toString() ?? "";
  const res = await rejectCoachChange(requestId, formData.get("note")?.toString() ?? "");
  if ("error" in res) return res;
  await notifyCoachChangeResult(requestId, "rejected").catch(() => {});
  refresh();
  return { ok: true };
}
