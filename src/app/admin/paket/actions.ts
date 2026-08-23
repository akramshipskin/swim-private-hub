"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
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

  const name = toProperCase(formData.get("name")?.toString().trim() ?? "");
  const totalSesi = Number(formData.get("totalSesi"));
  const price = Number(formData.get("price"));
  const durationDays = Number(formData.get("durationDays"));
  const jatahCancel = Number(formData.get("jatahCancel"));

  if (
    !name ||
    !Number.isInteger(totalSesi) || totalSesi < 1 ||
    !Number.isFinite(price) || price < 0 ||
    !Number.isInteger(durationDays) || durationDays < 1 ||
    !Number.isInteger(jatahCancel) || jatahCancel < 0
  ) {
    return { error: "Nama wajib diisi, total sesi/durasi minimal 1, harga & jatah cancel gak boleh negatif" };
  }

  await prisma.packageTemplate.create({
    data: { name, totalSesi, price, durationDays, jatahCancel },
  });

  revalidatePath("/admin/paket");
  return null;
}

export async function updateTemplate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const templateId = formData.get("templateId") as string;
  const name = toProperCase(formData.get("name")?.toString().trim() ?? "");
  const totalSesi = Number(formData.get("totalSesi"));
  const price = Number(formData.get("price"));
  const durationDays = Number(formData.get("durationDays"));
  const jatahCancel = Number(formData.get("jatahCancel"));
  const isActive = formData.get("isActive") === "on";

  if (
    !name ||
    !Number.isInteger(totalSesi) || totalSesi < 1 ||
    !Number.isFinite(price) || price < 0 ||
    !Number.isInteger(durationDays) || durationDays < 1 ||
    !Number.isInteger(jatahCancel) || jatahCancel < 0
  ) {
    return { error: "Nama wajib diisi, total sesi/durasi minimal 1, harga & jatah cancel gak boleh negatif" };
  }

  await prisma.packageTemplate.update({
    where: { id: templateId },
    data: { name, totalSesi, price, durationDays, jatahCancel, isActive },
  });

  revalidatePath("/admin/paket");
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
    return { error: err instanceof Error ? err.message : "Gagal nambah peserta" };
  }

  revalidatePath("/admin/paket");
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
      error: "Member ini belum punya peserta terdaftar -- tambahin dulu di section \"Tambah Peserta\" sebelum assign paket.",
    };
  }
  if (!name) {
    return { error: "Nama paket wajib diisi" };
  }
  if (!Number.isInteger(totalSesi) || totalSesi < 1) {
    return { error: "Total sesi minimal 1" };
  }
  if (!Number.isInteger(jatahCancel) || jatahCancel < 0) {
    return { error: "Jatah cancel gak boleh negatif" };
  }

  // Anak yang dipilih harus emang punya member ini -- dropdown di form
  // udah discope per-member, tapi tetep divalidasi ulang di server (IDOR
  // guard, jangan percaya begitu aja apa yang dikirim client).
  const dependent = await prisma.dependent.findUnique({
    where: { id: dependentId },
    select: { memberId: true },
  });
  if (!dependent || dependent.memberId !== memberId) {
    return { error: "Anak gak ditemukan atau bukan punya member ini" };
  }

  await prisma.package.create({
    data: {
      memberId,
      dependentId,
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

  revalidatePath("/admin/paket");
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
    return { error: "Sisa sesi gak boleh negatif" };
  }
  if (!Number.isInteger(jatahCancelRaw) || jatahCancelRaw < 0) {
    return { error: "Jatah cancel gak boleh negatif" };
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    return { error: "Paket gak ketemu, mungkin udah dihapus." };
  }
  // Clamp biar sisa sesi gak bisa ngelewatin total sesi paketnya sendiri.
  const sisaSesi = Math.min(sisaSesiRaw, pkg.totalSesi);

  await prisma.package.update({
    where: { id: packageId },
    data: {
      sisaSesi,
      jatahCancel: jatahCancelRaw,
      status,
      expiredDate: expiredDateRaw ? new Date(`${expiredDateRaw}T23:59:59+07:00`) : null,
    },
  });

  revalidatePath("/admin/paket");
  return null;
}
