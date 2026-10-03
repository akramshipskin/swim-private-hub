"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { POOL_FACILITIES } from "@/lib/pool-facilities";
import { hasPoolHours, poolHoursLabel, withinPoolHours } from "@/lib/pool-hours";
import { notifyAdmins } from "@/lib/notify";
import { notifyWaitlistForPool } from "@/lib/coach-pools";
import { isCity } from "@/lib/cities";
import { parseDailyCapacity } from "@/lib/pricing";
import { PARTNER_AGREEMENT_REQUIRED_ERROR } from "@/lib/partner-agreement";
import { PHOTO_BUCKET, extensionFor, isStorageConfigured, publicObjectUrl, uploadObject, validateUpload, hasMatchingSignature, SIGNATURE_MISMATCH_ERROR } from "@/lib/storage";

export type PoolInfoState = { error?: string; ok?: boolean; warning?: string } | null;

const MAX_POOL_PHOTOS = 6;

// Hak akses info kolam: admin, atau pemilik kolam itu sendiri.
async function canEditPool(poolId: string) {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." as const };
  // Gerbang yang sama dengan requireRole: server action bisa dipanggil langsung.
  if (session.user.mustChangePassword) return { error: "Ganti password sementara dulu sebelum mengubah info kolam." as const };
  if (session.user.needsTotpSetup) return { error: "Pasang verifikasi 2 langkah dulu di menu Keamanan." as const };
  if (session.user.needsPartnerAgreement) return { error: PARTNER_AGREEMENT_REQUIRED_ERROR };
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
  if (address.length > 300) return { error: "Alamat maksimal 300 karakter." };
  if (contactPhone.length > 20) return { error: "No. telepon maksimal 20 karakter." };
  if ((openTime && !TIME.test(openTime)) || (closeTime && !TIME.test(closeTime))) {
    return { error: "Format jam harus JJ:MM, misal 06:00." };
  }
  if (!!openTime !== !!closeTime || (openTime && closeTime && openTime >= closeTime)) {
    return { error: "Isi jam buka dan jam tutup; jam tutup harus setelah jam buka." };
  }

  // Kota & kapasitas harian (Hadi 3 Okt). Hanya diubah bila isiannya dikirim
  // form; isian kosong ditolak supaya kolam tidak keluar dari saringan kota.
  const extraData: { city?: string; dailyCapacity?: number | null } = {};
  if (formData.has("city")) {
    const city = str("city");
    if (!isCity(city)) return { error: "Pilih kota kolam dari daftar." };
    extraData.city = city;
  }
  // Kapasitas kosong = tanpa batas (sama seperti kolam lama yang belum mengisi).
  if (formData.has("dailyCapacity")) {
    if (str("dailyCapacity") === "") extraData.dailyCapacity = null;
    else {
      const capacity = parseDailyCapacity(str("dailyCapacity"));
      if (typeof capacity !== "number") return { error: capacity.error };
      extraData.dailyCapacity = capacity;
    }
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
      ...extraData,
    },
  });
  if (updated.count === 0) return { error: "Kolam tidak ditemukan." };
  if (extraData.city) await notifyWaitlistForPool(poolId);

  // Ganti jam buka saat sudah ada booking di luar jam baru (Hadi 2 Okt malam,
  // #6): booking itu tetap jalan, kolam diberi tahu sekarang, admin dikabari
  // untuk menghubungi member/coach. Booking baru di luar jam buka ditolak.
  let warning: string | undefined;
  const hours = { openTime: openTime || null, closeTime: closeTime || null };
  if (hasPoolHours(hours)) {
    const upcoming = await prisma.booking.findMany({
      where: { status: "BOOKED", availability: { poolId, startTime: { gt: new Date() } } },
      select: { availability: { select: { startTime: true, endTime: true } } },
    });
    const outside = upcoming.filter((b) => !withinPoolHours(hours, b.availability.startTime, b.availability.endTime)).length;
    if (outside > 0) {
      warning = `Jam buka tersimpan. Ada ${outside} booking mendatang di luar jam buka baru (${poolHoursLabel(hours)}); booking itu tetap berjalan dan admin SPH akan menghubungi member & coach-nya.`;
      const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { name: true } });
      await notifyAdmins("Booking di luar jam buka baru", `${pool?.name ?? "Kolam"}: ${outside} booking mendatang di luar jam buka ${poolHoursLabel(hours)}.`, "/admin/booking-overview");
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, warning };
}

// Foto fasilitas kolam. Disimpan di bucket publik yang sama dengan foto coach
// (prefix pools/) supaya tidak perlu bucket Supabase baru.
export async function uploadPoolPhoto(_prev: PoolInfoState, formData: FormData): Promise<PoolInfoState> {
  const poolId = formData.get("poolId")?.toString() ?? "";
  const access = await canEditPool(poolId);
  if ("error" in access) return access;
  if (!isStorageConfigured()) return { error: "Unggah file belum diaktifkan (penyimpanan belum dikonfigurasi)." };

  const file = formData.get("photo") as File | null;
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const pool = await prisma.pool.findUnique({ where: { id: poolId }, select: { photos: true } });
  if (!pool) return { error: "Kolam tidak ditemukan." };
  if (pool.photos.length >= MAX_POOL_PHOTOS) return { error: `Maksimal ${MAX_POOL_PHOTOS} foto per kolam.` };

  const path = `pools/${poolId}/${Date.now()}.${extensionFor(file!)}`;
  try {
    await uploadObject(PHOTO_BUCKET, path, file!);
  } catch {
    return { error: "Unggah foto gagal, coba lagi." };
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
