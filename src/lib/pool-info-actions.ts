"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { POOL_FACILITIES } from "@/lib/pool-facilities";

export type PoolInfoState = { error?: string; ok?: boolean } | null;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Info kolam bisa diubah admin ATAU pemilik kolam itu sendiri.
export async function updatePoolInfo(_prev: PoolInfoState, formData: FormData): Promise<PoolInfoState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };
  const poolId = formData.get("poolId")?.toString() ?? "";

  const allowed =
    session.user.role === "ADMIN" ||
    (session.user.role === "POOL_OWNER" &&
      (await prisma.poolOwnership.count({ where: { poolId, ownerId: session.user.id } })) > 0);
  if (!allowed) return { error: "Kamu tidak punya akses ke kolam ini." };

  const str = (k: string) => formData.get(k)?.toString().trim() ?? "";
  const description = str("description");
  const address = str("address");
  const contactPhone = str("contactPhone");
  const openTime = str("openTime");
  const closeTime = str("closeTime");
  if (description.length > 1000) return { error: "Deskripsi maksimal 1000 karakter." };
  if ((openTime && !TIME.test(openTime)) || (closeTime && !TIME.test(closeTime))) {
    return { error: "Format jam harus JJ:MM, misal 06:00." };
  }

  const checked = formData
    .getAll("facilities")
    .map(String)
    .filter((f) => (POOL_FACILITIES as readonly string[]).includes(f));
  const extra = str("extraFacilities")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  if (extra.length > 8 || extra.some((f) => f.length > 40)) {
    return { error: "Fasilitas lain maksimal 8 item, masing-masing maksimal 40 karakter." };
  }

  const updated = await prisma.pool.updateMany({
    where: { id: poolId },
    data: {
      description: description || null,
      address: address || null,
      contactPhone: contactPhone || null,
      openTime: openTime || null,
      closeTime: closeTime || null,
      facilities: [...new Set([...checked, ...extra])],
    },
  });
  if (updated.count === 0) return { error: "Kolam tidak ditemukan." };

  revalidatePath("/", "layout");
  return { ok: true };
}
