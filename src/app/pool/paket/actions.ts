"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parsePackPrices } from "@/lib/pricing";
import { notifyWaitlistForPool } from "@/lib/coach-pools";
import type { PackPriceState } from "@/components/pack-price-form";

async function ownsPool(userId: string, poolId: string) {
  return (await prisma.poolOwnership.count({ where: { poolId, ownerId: userId } })) > 0;
}

// Pemilik kolam memasang harga tiket paket 4/8 sesi (Hadi 2 Okt): langsung
// berlaku seperti harga coach, paket yang sudah dibeli tidak berubah.
export async function updatePoolPrices(_prev: PackPriceState, formData: FormData): Promise<PackPriceState> {
  const session = await requireRole("POOL_OWNER");
  const poolId = formData.get("poolId")?.toString() ?? "";
  if (!poolId || !(await ownsPool(session.user.id, poolId))) return { error: "Kamu tidak punya akses ke kolam ini." };
  const current = await prisma.pool.findUnique({ where: { id: poolId }, select: { pricePack4: true, pricePack8: true } });
  if (!current) return { error: "Kolam tidak ditemukan." };
  const prices = parsePackPrices(formData, current);
  if ("error" in prices) return prices;
  await prisma.pool.update({ where: { id: poolId }, data: prices });
  await notifyWaitlistForPool(poolId);
  revalidatePath("/pool/paket");
  revalidatePath("/member/paket");
  revalidatePath("/");
  return { ok: true };
}
