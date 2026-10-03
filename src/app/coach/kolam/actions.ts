"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/require-role";
import { pickCoachPool, releaseCoachPool } from "@/lib/coach-pools";

// Coach memilih / melepas kolam tempat ia mengajar (Hadi 3 Okt). Hanya untuk
// akun coach itu sendiri; aturan dijaga di src/lib/coach-pools.ts. poolId dari
// tombol bisa dipalsukan: semua pengecekan ada di server.
export async function pickPool(poolId: string) {
  const session = await requireRole("COACH");
  const result = await pickCoachPool(session.user.id, typeof poolId === "string" ? poolId : "");
  revalidatePath("/coach", "layout");
  revalidatePath("/member/paket");
  redirect(result === "OK" ? "/coach/kolam?ok=pilih" : `/coach/kolam?error=${result === "COACH_INACTIVE" ? "nonaktif" : "kolam"}`);
}

export async function releasePool(poolId: string) {
  const session = await requireRole("COACH");
  const result = await releaseCoachPool(session.user.id, typeof poolId === "string" ? poolId : "");
  revalidatePath("/coach", "layout");
  revalidatePath("/member/paket");
  redirect(result === "OK" ? "/coach/kolam?ok=lepas" : `/coach/kolam?error=${result === "HAS_MEMBERS" ? "member" : "kolam"}`);
}
