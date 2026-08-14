"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Katalog paket (PackageTemplate) -- gak nempel ke member manapun ---

export async function createTemplate(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name")?.toString().trim() ?? "";
  const totalSesi = Number(formData.get("totalSesi"));
  const price = Number(formData.get("price"));

  if (!name || !Number.isInteger(totalSesi) || totalSesi < 1 || !Number.isFinite(price) || price < 0) {
    throw new Error("Nama wajib diisi, total sesi minimal 1, harga gak boleh negatif");
  }

  await prisma.packageTemplate.create({
    data: { name, totalSesi, price },
  });

  revalidatePath("/admin/paket");
}

export async function updateTemplate(formData: FormData) {
  await requireRole("ADMIN");

  const templateId = formData.get("templateId") as string;
  const name = formData.get("name")?.toString().trim() ?? "";
  const totalSesi = Number(formData.get("totalSesi"));
  const price = Number(formData.get("price"));
  const isActive = formData.get("isActive") === "on";

  if (!name || !Number.isInteger(totalSesi) || totalSesi < 1 || !Number.isFinite(price) || price < 0) {
    throw new Error("Nama wajib diisi, total sesi minimal 1, harga gak boleh negatif");
  }

  await prisma.packageTemplate.update({
    where: { id: templateId },
    data: { name, totalSesi, price, isActive },
  });

  revalidatePath("/admin/paket");
}

// --- Assign paket ke member (custom, boleh dari katalog atau bebas) ---

export async function assignPackageToMember(formData: FormData) {
  await requireRole("ADMIN");

  const memberId = formData.get("memberId") as string;
  const templateId = formData.get("templateId") as string | null;
  const name = formData.get("name")?.toString().trim() ?? "";
  const totalSesi = Number(formData.get("totalSesi"));
  const expiredDateRaw = formData.get("expiredDate") as string;

  if (!memberId || !name || !Number.isInteger(totalSesi) || totalSesi < 1) {
    throw new Error("Member, nama paket wajib diisi, total sesi minimal 1");
  }

  await prisma.package.create({
    data: {
      memberId,
      templateId: templateId || null,
      name,
      totalSesi,
      sisaSesi: totalSesi,
      status: "ACTIVE",
      startDate: new Date(),
      expiredDate: expiredDateRaw ? new Date(`${expiredDateRaw}T23:59:59+07:00`) : null,
    },
  });

  revalidatePath("/admin/paket");
}

// --- Edit paket milik member (sisa sesi, status, masa berlaku) ---

export async function updatePackage(formData: FormData) {
  await requireRole("ADMIN");

  const packageId = formData.get("packageId") as string;
  const sisaSesiRaw = Number(formData.get("sisaSesi"));
  const status = formData.get("status") as "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED";
  const expiredDateRaw = formData.get("expiredDate") as string;

  if (!packageId || !Number.isInteger(sisaSesiRaw) || sisaSesiRaw < 0) {
    throw new Error("Sisa sesi gak boleh negatif");
  }

  const pkg = await prisma.package.findUniqueOrThrow({ where: { id: packageId } });
  // Clamp biar sisa sesi gak bisa ngelewatin total sesi paketnya sendiri.
  const sisaSesi = Math.min(sisaSesiRaw, pkg.totalSesi);

  await prisma.package.update({
    where: { id: packageId },
    data: {
      sisaSesi,
      status,
      expiredDate: expiredDateRaw ? new Date(`${expiredDateRaw}T23:59:59+07:00`) : null,
    },
  });

  revalidatePath("/admin/paket");
}
