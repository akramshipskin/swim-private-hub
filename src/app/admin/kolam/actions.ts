"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string } | null;

export async function updatePoolShares(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const poolId = formData.get("poolId") as string;
  const commissionPercent = Number(formData.get("commissionPercent"));
  const coachSharePercent = Number(formData.get("coachSharePercent"));

  if (
    !Number.isInteger(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100 ||
    !Number.isInteger(coachSharePercent) ||
    coachSharePercent < 0 ||
    coachSharePercent > 100
  ) {
    return { error: "Persentase harus angka 0-100." };
  }
  // Sisa (100 - commission - coach) itu bagian kolam -- kalau dua-duanya
  // udah >100, gak ada sisa buat kolam sama sekali, itu jelas salah input.
  if (commissionPercent + coachSharePercent > 100) {
    return { error: "Total komisi platform + bagian coach gak boleh lebih dari 100%." };
  }

  await prisma.pool.update({
    where: { id: poolId },
    data: { commissionPercent, coachSharePercent },
  });

  revalidatePath("/admin/kolam");
  return null;
}
