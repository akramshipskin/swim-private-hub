"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { parsePackPrices } from "@/lib/pricing";
import type { PackPriceState } from "@/components/pack-price-form";

// Coach memasang harga jasanya sendiri (Hadi 2 Okt): langsung berlaku,
// paket yang sudah dibeli menyimpan harganya sendiri.
export async function updateCoachPrices(_prev: PackPriceState, formData: FormData): Promise<PackPriceState> {
  const session = await requireRole("COACH");
  const current = await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { pricePack4: true, pricePack8: true } });
  if (!current) return { error: "Profil coach tidak ditemukan. Hubungi admin." };
  const prices = parsePackPrices(formData, current);
  if ("error" in prices) return prices;
  const res = await prisma.coachProfile.updateMany({ where: { userId: session.user.id }, data: prices });
  if (res.count === 0) return { error: "Profil coach tidak ditemukan. Hubungi admin." };
  revalidatePath("/coach/harga");
  revalidatePath("/member/paket");
  return { ok: true };
}
