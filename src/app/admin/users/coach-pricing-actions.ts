"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { changedPackPrices, parsePackPrices } from "@/lib/pricing";
import type { PackPriceState } from "@/components/pack-price-form";

// Admin bisa mengisi harga coach (membantu coach yang belum bisa) dan menandai
// bebas potongan PPh 0,5% setelah coach menyerahkan surat pernyataan omzet.
export async function updateCoachPricing(_prev: PackPriceState, formData: FormData): Promise<PackPriceState> {
  await requireRole("ADMIN");
  const userId = formData.get("userId")?.toString() ?? "";
  const current = await prisma.coachProfile.findUnique({ where: { userId }, select: { pricePack4: true, pricePack8: true } });
  if (!current) return { error: "Profil coach tidak ditemukan." };
  const prices = parsePackPrices(formData, current);
  if ("error" in prices) return prices;
  const res = await prisma.coachProfile.updateMany({
    where: { userId },
    data: { ...changedPackPrices(formData, prices), pphExempt: formData.get("pphExempt") === "on" },
  });
  if (res.count === 0) return { error: "Profil coach tidak ditemukan." };
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/member/paket");
  return { ok: true };
}
