"use server";

import { refundPackage, RefundError } from "@/lib/package-refund";
import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { withDedupeLock } from "@/lib/dedupe-lock";
import { createDependent, createSelfDependent } from "@/lib/dependents";
import { parseParticipantBirthDate } from "@/lib/participant-input";
import { formNumber } from "@/lib/format";
import { packQuote } from "@/lib/pricing";
import { resolveExpiredDate } from "@/lib/datetime";
import { revalidatePath } from "next/cache";
import { userErrorMessage } from "@/lib/user-error";

export type ActionState = { error?: string; success?: string } | null;

// --- Tambah anak buat member (admin) -- nutup gap: admin bikin member
// baru terus mau langsung assign paket di sesi yang sama, padahal anak
// cuma bisa dibikin pas member login pertama. Reuse createDependent
// yang sama kayak member self-service. ---

export async function addChildForMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const memberId = formData.get("memberId") as string;
  const type = formData.get("type")?.toString();
  const name = formData.get("name")?.toString() ?? "";

  if (!memberId) {
    return { error: "Pilih member dulu." };
  }

  try {
    // Tanggal lahir opsional untuk admin (member yang belum punya diminta
    // melengkapi sendiri di menu Peserta), tapi kalau diisi harus valid.
    const birthRaw = formData.get("birthDate")?.toString().trim() ?? "";
    const birthDate = birthRaw ? parseParticipantBirthDate(birthRaw) : null;
    if (type === "self") {
      const self = await createSelfDependent(memberId);
      if (birthDate) await prisma.dependent.update({ where: { id: self.id }, data: { birthDate } });
    } else {
      await createDependent(memberId, name, prisma, birthDate);
    }
  } catch (err) {
    return { error: userErrorMessage(err, "Gagal menambah peserta. Coba lagi.") };
  }

  revalidatePath("/admin/paket");
  revalidatePath("/admin/users");
  // Bukan null (= keadaan awal form): tanpa pesan, admin tidak tahu berhasil.
  return { success: "Peserta ditambahkan." };
}

// --- Berikan paket manual ke peserta (Hadi 2 Okt malam, #9) ---
// Model harga-dari-coach: admin memilih peserta + kolam + coach + paket 4/8 sesi.
// Harga kolam & coach saat ini disalin ke paket (sama seperti pembelian), tapi
// TIDAK ada pembayaran, jadi sesi-sesinya tidak membagi uang (lihat
// markAttendance: kredit hanya untuk paket ber-Payment SUCCESS).
export async function assignPackageToMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const memberId = formData.get("memberId")?.toString() ?? "";
  const dependentId = formData.get("dependentId")?.toString() ?? "";
  const poolId = formData.get("poolId")?.toString() ?? "";
  const coachId = formData.get("coachId")?.toString() ?? "";
  const sesi = Number(formData.get("sesi"));

  if (!memberId) return { error: "Pilih member dulu." };
  if (!dependentId) {
    return {
      error: "Member ini belum punya peserta. Tambahkan dulu di bagian \"Tambah Peserta\", lalu berikan paket.",
    };
  }
  if (!poolId || !coachId) return { error: "Pilih kolam dan coach dulu." };
  if (sesi !== 4 && sesi !== 8) return { error: "Pilih paket 4 atau 8 sesi." };

  // Peserta harus milik member ini (dropdown sudah dibatasi, tetap dicek ulang
  // di server: jangan percaya yang dikirim browser).
  const dependent = await prisma.dependent.findUnique({ where: { id: dependentId }, select: { memberId: true, isActive: true } });
  if (!dependent || dependent.memberId !== memberId || !dependent.isActive) {
    return { error: "Peserta tidak ditemukan atau bukan milik member ini." };
  }
  const [pool, coach] = await Promise.all([
    prisma.pool.findFirst({
      where: { id: poolId, isActive: true },
      select: { id: true, pricePack4: true, pricePack8: true, serviceFeeBps: true },
    }),
    prisma.user.findFirst({
      where: { id: coachId, role: "COACH", isActive: true, poolAffiliations: { some: { poolId } } },
      select: { name: true, coachProfile: { select: { isActive: true, pricePack4: true, pricePack8: true } } },
    }),
  ]);
  if (!pool) return { error: "Kolam tidak ditemukan atau sedang tidak aktif." };
  if (!coach?.coachProfile?.isActive) return { error: "Coach ini tidak mengajar di kolam ini atau sedang tidak aktif." };
  const quote = packQuote(pool, coach.coachProfile, sesi);
  if (!quote) return { error: `Harga paket ${sesi} sesi belum dipasang kolam atau coach ini.` };

  const name = `Paket ${quote.totalSesi} sesi · ${coach.name}`;
  // Klik ganda: paket yang sama untuk peserta yang sama dalam 30 detik = duplikat.
  const assigned = await withDedupeLock(`assign:${dependentId}`, async (tx) => {
    const dup = await tx.package.count({
      where: { dependentId, poolId, coachId, totalSesi: quote.totalSesi, createdAt: { gte: new Date(Date.now() - 30_000) } },
    });
    if (dup > 0) return false;
    const now = new Date();
    await tx.package.create({
      data: {
        memberId,
        dependentId,
        poolId,
        coachId,
        name,
        totalSesi: quote.totalSesi,
        sisaSesi: quote.totalSesi,
        jatahCancel: quote.jatahCancel,
        poolPrice: quote.poolPrice,
        coachPrice: quote.coachPrice,
        serviceFee: quote.serviceFee,
        durationDays: quote.durationDays,
        status: "ACTIVE",
        startDate: now,
        expiredDate: new Date(now.getTime() + quote.durationDays * 86_400_000),
      },
    });
    return true;
  });
  if (!assigned) return { error: "Paket yang sama baru saja diberikan ke peserta ini." };

  revalidatePath("/admin/paket");
  revalidatePath("/admin/users");
  return { success: `${name} diberikan (aktif ${quote.durationDays} hari, tanpa bagi hasil).` };
}

// --- Edit paket milik member (sisa sesi, status, masa berlaku) ---

export async function updatePackage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const packageId = formData.get("packageId") as string;
  const sisaSesiRaw = formNumber(formData, "sisaSesi");
  const jatahCancelRaw = formNumber(formData, "jatahCancel");
  const status = formData.get("status") as "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  const expiredDateRaw = formData.get("expiredDate") as string;

  if (!packageId || !Number.isInteger(sisaSesiRaw) || sisaSesiRaw < 0) {
    return { error: "Sisa sesi wajib diisi (0 atau lebih)." };
  }
  if (!Number.isInteger(jatahCancelRaw) || jatahCancelRaw < 0) {
    return { error: "Jatah batal wajib diisi (0 atau lebih)." };
  }

  // expectedSisaSesi = nilai sisa sesi pas form edit dibuka. Sisa sesi di
  // sini ditimpa nilai absolut, jadi kalau di antara buka form & klik
  // Simpan member sempet booking/batal, simpan tanpa cek ini nge-hapus
  // perubahan itu diem-diem (tes race lokal 2026-09-17: 3 booking masuk
  // barengan, sisa sesi balik ke angka lama = 3 sesi gratis). Wajib (TRD T11).
  const expectedRaw = formData.get("expectedSisaSesi");
  const expected = expectedRaw === null || expectedRaw === "" ? NaN : Number(expectedRaw);
  if (!Number.isInteger(expected)) {
    return { error: "Muat ulang halaman, lalu simpan lagi." };
  }

  const outcome = await prisma.$transaction(async (tx) => {
    // Kunci baris paket: booking/batal yang berjalan bersamaan antre di sini.
    const [pkg] = await tx.$queryRaw<{ totalSesi: number; sisaSesi: number; status: string; expiredDate: Date | null }[]>`
      SELECT "totalSesi", "sisaSesi", status::text AS status, "expiredDate" FROM "Package" WHERE id = ${packageId} FOR UPDATE`;
    if (!pkg) return "NOT_FOUND" as const;
    if (pkg.sisaSesi !== expected) return "CHANGED" as const;
    // Paket Menunggu Pembayaran hanya berubah lewat pembayaran (TRD T1): admin
    // tidak bisa mengaktifkannya tanpa bayar.
    if (pkg.status === "PENDING_PAYMENT") return "PENDING" as const;
    if (status !== "ACTIVE" && status !== "EXPIRED") return "BAD_STATUS" as const;
    // Sisa sesi maksimal = total dikurangi sesi yang sudah dibooking (yang
    // sudah berjalan atau terjadwal), supaya kolam dan coach tidak dibayar
    // melebihi yang dibayar member (TRD T11, Hadi 10 Okt).
    const used = await tx.booking.count({ where: { packageId, status: "BOOKED" } });
    const max = Math.max(0, pkg.totalSesi - used);
    if (sisaSesiRaw > max) return { tooMany: max };
    const expiredDate = resolveExpiredDate(expiredDateRaw, pkg.expiredDate);
    // Masa berlaku diubah: pemberitahuan paket mau berakhir boleh terkirim lagi.
    const expiryChanged = (expiredDate?.getTime() ?? null) !== (pkg.expiredDate?.getTime() ?? null);
    await tx.package.update({
      where: { id: packageId },
      data: { sisaSesi: sisaSesiRaw, jatahCancel: jatahCancelRaw, status, expiredDate, ...(expiryChanged ? { expiryNotice14At: null, expiryNotice3At: null } : {}) },
    });
    return "OK" as const;
  });
  if (outcome === "NOT_FOUND") return { error: "Paket tidak ditemukan, mungkin sudah dihapus." };
  if (outcome === "CHANGED") {
    return {
      error: "Sisa sesi paket ini baru saja berubah (ada booking/pembatalan baru). Muat ulang halaman, cek angkanya, lalu simpan lagi.",
    };
  }
  if (outcome === "PENDING") return { error: "Paket ini masih menunggu pembayaran, jadi belum bisa diubah." };
  if (outcome === "BAD_STATUS") return { error: "Status hanya bisa Aktif atau Berakhir." };
  if (typeof outcome === "object") {
    return { error: `Sisa sesi maksimal ${outcome.tooMany} (total sesi dikurangi sesi yang sudah dibooking).` };
  }

  revalidatePath("/admin/paket");
  return null;
}

// Kembalikan Dana (Hadi 10 Okt, TRD T1): lihat src/lib/package-refund.ts.
export async function refundPackageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("ADMIN");
  const num = (k: string) => {
    const raw = formData.get(k)?.toString().replace(/[^0-9]/g, "") ?? "";
    return raw === "" ? 0 : Number(raw);
  };
  try {
    await refundPackage({
      packageId: formData.get("packageId")?.toString() ?? "",
      adminId: session.user.id,
      cash: num("refundCash"),
      saldo: num("refundSaldo"),
      reference: formData.get("refundReference")?.toString() ?? "",
      note: formData.get("refundNote")?.toString() ?? "",
    });
  } catch (err) {
    if (err instanceof RefundError) return { error: err.message };
    throw err;
  }
  revalidatePath("/admin/paket");
  return { success: "Dana dikembalikan, paket diakhiri." };
}
