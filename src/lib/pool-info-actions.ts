"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { POOL_FACILITIES } from "@/lib/pool-facilities";
import { PHOTO_BUCKET, extensionFor, isStorageConfigured, publicObjectUrl, uploadObject, validateUpload } from "@/lib/storage";

export type PoolInfoState = { error?: string; ok?: boolean } | null;

const MAX_POOL_PHOTOS = 6;

// Hak akses info kolam: admin, atau pemilik kolam itu sendiri.
async function canEditPool(poolId: string) {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." as const };
  const allowed =
    session.user.role === "ADMIN" ||
    (session.user.role === "POOL_OWNER" &&
      (await prisma.poolOwnership.count({ where: { poolId, ownerId: session.user.id } })) > 0);
  return allowed ? { ok: true as const } : { error: "Kamu tidak punya akses ke kolam ini." as const };
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Info kolam bisa diubah admin ATAU pemilik kolam itu sendiri.
export async function updatePoolInfo(_prev: PoolInfoState, formData: FormData): Promise<PoolInfoState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };
  const poolId = formData.get("poolId")?.toString() ?? "";

  const access = await canEditPool(poolId);
  if ("error" in access) return access;

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

// Foto fasilitas kolam. Disimpan di bucket publik yang sama dengan foto coach
// (prefix pools/) supaya tidak perlu bucket Supabase baru.
export async function uploadPoolPhoto(_prev: PoolInfoState, formData: FormData): Promise<PoolInfoState> {
  const poolId = formData.get("poolId")?.toString() ?? "";
  const access = await canEditPool(poolId);
  if ("error" in access) return access;
  if (!isStorageConfigured()) return { error: "Upload file belum diaktifkan (storage belum dikonfigurasi)." };

  const file = formData.get("photo") as File | null;
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };

  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { photos: true } });
  if (!pool) return { error: "Kolam tidak ditemukan." };
  if (pool.photos.length >= MAX_POOL_PHOTOS) return { error: `Maksimal ${MAX_POOL_PHOTOS} foto per kolam.` };

  const path = `pools/${poolId}/${Date.now()}.${extensionFor(file!)}`;
  try {
    await uploadObject(PHOTO_BUCKET, path, file!);
  } catch {
    return { error: "Upload foto gagal, coba lagi." };
  }
  await prisma.pool.update({
    where: { id: poolId },
    data: { photos: [...pool.photos, publicObjectUrl(PHOTO_BUCKET, path)] },
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePoolPhoto(_prev: PoolInfoState, formData: FormData): Promise<PoolInfoState> {
  const poolId = formData.get("poolId")?.toString() ?? "";
  const url = formData.get("url")?.toString() ?? "";
  const access = await canEditPool(poolId);
  if ("error" in access) return access;

  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { photos: true } });
  if (!pool) return { error: "Kolam tidak ditemukan." };
  // Baris DB saja yang dihapus; file di storage dibiarkan (hemat, dan tidak
  // ada risiko menghapus file yang ternyata masih dipakai kolam lain).
  await prisma.pool.update({ where: { id: poolId }, data: { photos: pool.photos.filter((p) => p !== url) } });

  revalidatePath("/", "layout");
  return { ok: true };
}
