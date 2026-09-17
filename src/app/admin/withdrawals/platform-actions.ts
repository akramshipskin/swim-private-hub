"use server";

import { requireRole } from "@/lib/require-role";
import { revalidatePath } from "next/cache";
import { withdrawPlatformBalance, PlatformWithdrawalError } from "@/lib/platform-wallet";

export type PlatformWithdrawState = { error?: string; ok?: boolean } | null;

export async function withdrawPlatform(_prev: PlatformWithdrawState, formData: FormData): Promise<PlatformWithdrawState> {
  const session = await requireRole("ADMIN");
  try {
    await withdrawPlatformBalance({
      adminId: session.user.id,
      revenueAmount: Number(formData.get("revenueAmount") || 0),
      includeTax: formData.get("includeTax") === "on",
      note: formData.get("note")?.toString().trim() || null,
    });
  } catch (err) {
    if (err instanceof PlatformWithdrawalError) return { error: err.message };
    throw err;
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}
