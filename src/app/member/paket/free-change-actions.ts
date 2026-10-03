"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { freeCoachChange, notifyCoachChangeResult } from "@/lib/coach-change";
import { coachMeetsOpenSlotRule } from "@/lib/coach-open-slots";

// Ganti coach tanpa biaya hari ke-10 (Hadi 3 Okt). Semua aturan dicek di
// server (src/lib/coach-change.ts freeCoachChange); argumen dari tombol bisa
// dipalsukan.
export type FreeChangeState = { error?: string } | null;

export async function freeChangeCoach(packageId: string, toCoachId: string, toPoolId: string, _prev: FreeChangeState): Promise<FreeChangeState> {
  const session = await requireRole("MEMBER");
  const now = new Date();
  const result = await prisma.$transaction((tx) =>
    freeCoachChange(
      tx,
      { memberId: session.user.id, packageId: String(packageId), toCoachId: String(toCoachId), toPoolId: String(toPoolId) },
      (coachId, poolId) => coachMeetsOpenSlotRule(coachId, poolId, now, tx),
      now,
    ),
  );
  if (!result.ok) return { error: result.error };
  await notifyCoachChangeResult(result.requestId, "completed");
  revalidatePath("/member", "layout");
  redirect("/member/paket?ganti=ok");
}
