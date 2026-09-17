"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { withDedupeLock } from "@/lib/dedupe-lock";
import { createTemplateRecord, updateTemplateRecord } from "@/lib/package-template";
import { createDependent, createSelfDependent } from "@/lib/dependents";
import { toProperCase } from "@/lib/format";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string } | null;

// --- Katalog paket (PackageTemplate) -- gak nempel ke member manapun ---

export async function createTemplate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");
  const res = await createTemplateRecord(formData);
  if (res) return res;
  revalidatePath("/admin/paket");
  revalidatePath("/pool/paket");
  return null;
}

export async function updateTemplate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");
  const res = await updateTemplateRecord(formData);
  if (res) return res;
  revalidatePath("/admin/paket");
  revalidatePath("/pool/paket");
  return null;
}

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
    return { error: "Pilih member dulu" };
  }

  try {
    if (type === "self") {
      await createSelfDependent(memberId);
    } else {
      await createDependent(memberId, name);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menambah peserta" };
  }

  revalidatePath("/admin/paket");
  revalidatePath("/admin/users");
  return null;
}

// --- Assign paket ke member (custom, boleh dari katalog atau bebas) ---

export async function assignPackageToMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const memberId = formData.get("memberId") as string;
  const dependentId = formData.get("dependentId") as string;
  const templateId = formData.get("templateId") as string | null;
  const poolIdRaw = formData.get("poolId") as string | null;
  const name = toProperCase(formData.get("name")?.toString().trim() ?? "");
  const totalSesi = Number(formData.get("totalSesi"));
  const jatahCancelRaw = formData.get("jatahCancel");
  const jatahCancel = jatahCancelRaw ? Number(jatahCancelRaw) : 2;
  const expiredDateRaw = formData.get("expiredDate") as string;

  // Pesan spesifik per kondisi -- sebelumnya 1 pesan gabungan bikin bingung
  // (misal semua kolom keisi bener tapi tetep muncul "wajib diisi" karena
  // dependentId kosong -- member belum punya peserta terdaftar sama sekali).
  if (!memberId) {
    return { error: "Pilih member dulu" };
  }
  if (!dependentId) {
    return {
      error: "Member ini belum punya peserta terdaftar — tambahin dulu di section \"Tambah Peserta\" sebelum assign paket.",
    };
  }
  if (!name) {
    return { error: "Nama paket wajib diisi" };
  }
  if (!Number.isInteger(totalSesi) || totalSesi < 1) {
    return { error: "Total sesi minimal 1" };
  }
  if (!Number.isInteger(jatahCancel) || jatahCancel < 0) {
    return { error: "Jatah cancel tidak boleh negatif" };
  }

  // Anak yang dipilih harus emang punya member ini -- dropdown di form
  // udah discope per-member, tapi tetep divalidasi ulang di server (IDOR
  // guard, jangan percaya begitu aja apa yang dikirim client).
  const dependent = await prisma.dependent.findUnique({
    where: { id: dependentId },
    select: { memberId: true },
  });
  if (!dependent || dependent.memberId !== memberId) {
    return { error: "Anak tidak ditemukan atau bukan punya member ini" };
  }

  // Paket wajib pin ke 1 kolam (locked /plan-eng-review 2026-09-12) --
  // kalau assign dari katalog, poolId ikut template-nya; kalau custom
  // (gak pake template), admin wajib pilih kolam eksplisit di form.
  let poolId = poolIdRaw;
  if (templateId) {
    const template = await prisma.packageTemplate.findUnique({
      where: { id: templateId },
      select: { poolId: true },
    });
    if (!template) {
      return { error: "Template paket tidak ditemukan" };
    }
    poolId = template.poolId;
  }
  if (!poolId) {
    return { error: "Kolam wajib dipilih (kalau bukan dari katalog paket)" };
  }

  // Klik ganda Assign: paket yang sama (nama & kolam) untuk peserta yang sama
  // dalam 30 detik terakhir dianggap duplikat.
  const assigned = await withDedupeLock(`assign:${dependentId}`, async (tx) => {
    const dup = await tx.package.count({
      where: { dependentId, poolId, name, createdAt: { gte: new Date(Date.now() - 30_000) } },
    });
    if (dup > 0) return false;
    await tx.package.create({
    data: {
      memberId,
      dependentId,
      poolId,
      templateId: templateId || null,
      name,
      totalSesi,
      sisaSesi: totalSesi,
      jatahCancel,
      status: "ACTIVE",
      startDate: new Date(),
      expiredDate: expiredDateRaw ? new Date(`${expiredDateRaw}T23:59:59+07:00`) : null,
    },
    });
    return true;
  });
  if (!assigned) return { error: "Paket yang sama baru saja di-assign ke peserta ini." };

  revalidatePath("/admin/paket");
  revalidatePath("/admin/users");
  return null;
}

// --- Edit paket milik member (sisa sesi, status, masa berlaku) ---

export async function updatePackage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const packageId = formData.get("packageId") as string;
  const sisaSesiRaw = Number(formData.get("sisaSesi"));
  const jatahCancelRaw = Number(formData.get("jatahCancel"));
  const status = formData.get("status") as "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  const expiredDateRaw = formData.get("expiredDate") as string;

  if (!packageId || !Number.isInteger(sisaSesiRaw) || sisaSesiRaw < 0) {
    return { error: "Sisa sesi tidak boleh negatif" };
  }
  if (!Number.isInteger(jatahCancelRaw) || jatahCancelRaw < 0) {
    return { error: "Jatah cancel tidak boleh negatif" };
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return { error: "Paket tidak bertemu, mungkin sudah dihapus." };
  }
  // Clamp biar sisa sesi gak bisa ngelewatin total sesi paketnya sendiri.
  const sisaSesi = Math.min(sisaSesiRaw, pkg.totalSesi);

  // expectedSisaSesi = nilai sisa sesi pas form edit dibuka. Sisa sesi di
  // sini ditimpa nilai absolut, jadi kalau di antara buka form & klik
  // Simpan member sempet booking/batal, simpan tanpa cek ini nge-hapus
  // perubahan itu diem-diem (tes race lokal 2026-09-17: 3 booking masuk
  // barengan, sisa sesi balik ke angka lama = 3 sesi gratis).
  const expectedRaw = formData.get("expectedSisaSesi");
  const expected = expectedRaw === null || expectedRaw === "" ? null : Number(expectedRaw);

  const result = await prisma.package.updateMany({
    where: { id: packageId, ...(expected !== null && Number.isInteger(expected) ? { sisaSesi: expected } : {}) },
    data: {
      sisaSesi,
      jatahCancel: jatahCancelRaw,
      status,
      expiredDate: expiredDateRaw ? new Date(`${expiredDateRaw}T23:59:59+07:00`) : null,
    },
  });
  if (result.count === 0) {
    return {
      error: "Sisa sesi paket ini baru saja berubah (ada booking/pembatalan baru). Refresh halaman, cek angkanya, lalu simpan lagi.",
    };
  }

  revalidatePath("/admin/paket");
  return null;
}
