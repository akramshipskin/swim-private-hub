import { prisma } from "@/lib/prisma";
import { withDedupeLock } from "@/lib/dedupe-lock";
import { toProperCase } from "@/lib/format";
import { Prisma } from "@/generated/prisma/client";

export type TemplateFields = {
  name: string;
  totalSesi: number;
  price: number;
  durationDays: number;
  jatahCancel: number;
  isActive: boolean;
};

// Usulan pemilik kolam yang menunggu persetujuan admin (PackageTemplate.pendingChanges).
export type PendingTemplateChange = TemplateFields & { isNew: boolean; submittedAt: string };

const INVALID = "Nama wajib diisi, total sesi/durasi minimal 1, harga minimal Rp1 (angka bulat), jatah pembatalan tidak boleh negatif";

export function parseTemplateFields(formData: FormData, defaultActive: boolean): TemplateFields | { error: string } {
  const name = toProperCase(formData.get("name")?.toString().trim() ?? "");
  const totalSesi = Number(formData.get("totalSesi"));
  const price = Number(formData.get("price"));
  const durationDays = Number(formData.get("durationDays"));
  const jatahCancel = Number(formData.get("jatahCancel"));
  const isActive = formData.has("isActive") ? formData.get("isActive") === "on" : defaultActive;
  if (
    !name ||
    !Number.isInteger(totalSesi) || totalSesi < 1 ||
    !Number.isInteger(price) || price < 1 ||
    !Number.isInteger(durationDays) || durationDays < 1 ||
    !Number.isInteger(jatahCancel) || jatahCancel < 0
  ) {
    return { error: INVALID };
  }
  return { name, totalSesi, price, durationDays, jatahCancel, isActive };
}

// Admin: langsung dibuat & dijual.
export async function createTemplateRecord(formData: FormData): Promise<{ error: string } | null> {
  const poolId = formData.get("poolId")?.toString() ?? "";
  const fields = parseTemplateFields(formData, true);
  if (!poolId) return { error: "Kolam wajib dipilih." };
  if ("error" in fields) return fields;
  return createTemplate(poolId, fields, null);
}

// Pemilik kolam: paket baru dibuat nonaktif (tidak dijual) sampai admin menyetujui.
export async function proposeNewTemplate(poolId: string, formData: FormData): Promise<{ error: string } | null> {
  const fields = parseTemplateFields(formData, true);
  if ("error" in fields) return fields;
  const pending: PendingTemplateChange = { ...fields, isActive: true, isNew: true, submittedAt: new Date().toISOString() };
  return createTemplate(poolId, { ...fields, isActive: false }, pending);
}

async function createTemplate(poolId: string, fields: TemplateFields, pending: PendingTemplateChange | null) {
  // Nama paket unik per kolam; dicek di dalam lock biar klik ganda tidak bikin kembar.
  const created = await withDedupeLock(`template:${poolId}`, async (tx) => {
    const exists = await tx.packageTemplate.count({ where: { poolId, name: fields.name } });
    if (exists > 0) return false;
    await tx.packageTemplate.create({
      data: { poolId, ...fields, pendingChanges: pending ?? undefined },
    });
    return true;
  });
  return created ? null : { error: "Paket dengan nama ini sudah ada di kolam tersebut." };
}

// Admin: perubahan langsung berlaku (sekaligus membuang usulan yang tertunda).
export async function updateTemplateRecord(formData: FormData): Promise<{ error: string } | null> {
  const templateId = formData.get("templateId")?.toString() ?? "";
  const fields = parseTemplateFields(formData, false);
  if ("error" in fields) return fields;
  await prisma.packageTemplate.update({
    where: { id: templateId },
    data: { ...fields, pendingChanges: Prisma.DbNull },
  });
  return null;
}

// Pemilik kolam: nilai yang dijual tidak berubah; usulan disimpan untuk admin.
export async function proposeTemplateUpdate(templateId: string, formData: FormData): Promise<{ error: string } | null> {
  const fields = parseTemplateFields(formData, false);
  if ("error" in fields) return fields;
  const current = await prisma.packageTemplate.findUnique({ where: { id: templateId }, select: { pendingChanges: true } });
  const wasNew = (current?.pendingChanges as PendingTemplateChange | null)?.isNew ?? false;
  const pending: PendingTemplateChange = { ...fields, isNew: wasNew, submittedAt: new Date().toISOString() };
  await prisma.packageTemplate.update({ where: { id: templateId }, data: { pendingChanges: pending } });
  return null;
}

// Admin menyetujui/menolak usulan. CAS: hanya kalau usulan masih ada.
export async function reviewTemplateChange(templateId: string, approve: boolean) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.packageTemplate.findUnique({ where: { id: templateId }, select: { pendingChanges: true } });
    const pending = t?.pendingChanges as PendingTemplateChange | null;
    if (!pending) return false;
    const { isNew, submittedAt: _s, ...fields } = pending;
    void _s;
    const data: Prisma.PackageTemplateUpdateManyMutationInput = approve
      ? { ...fields, pendingChanges: Prisma.DbNull }
      : isNew
        ? { pendingChanges: Prisma.DbNull, isActive: false }
        : { pendingChanges: Prisma.DbNull };
    const res = await tx.packageTemplate.updateMany({
      where: { id: templateId, pendingChanges: { not: Prisma.DbNull } },
      data,
    });
    return res.count > 0;
  });
}
