"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string } | null;

// --- Katalog paket (PackageTemplate) -- gak nempel ke member manapun ---

export async function createTemplate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const name = formData.get("name")?.toString().trim() ?? "";
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
  const name = formData.get("name")?.toString().trim() ?? "";
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

// --- Assign paket ke member (custom, boleh dari katalog atau bebas) ---

export async function assignPackageToMember(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const memberId = formData.get("memberId") as string;
  const templateId = formData.get("templateId") as string | null;
  const name = formData.get("name")?.toString().trim() ?? "";
  const totalSesi = Number(formData.get("totalSesi"));
  const jatahCancelRaw = formData.get("jatahCancel");
  const jatahCancel = jatahCancelRaw ? Number(jatahCancelRaw) : 2;
  const expiredDateRaw = formData.get("expiredDate") as string;

  if (
    !memberId || !name ||
    !Number.isInteger(totalSesi) || totalSesi < 1 ||
    !Number.isInteger(jatahCancel) || jatahCancel < 0
  ) {
    return { error: "Member, nama paket wajib diisi, total sesi minimal 1, jatah cancel gak boleh negatif" };
  }

  await prisma.package.create({
    data: {
      memberId,
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
