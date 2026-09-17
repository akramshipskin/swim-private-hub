import { prisma } from "@/lib/prisma";
import { withDedupeLock } from "@/lib/dedupe-lock";
import { toProperCase } from "@/lib/format";

// Validasi + simpan katalog paket. Dipakai admin (semua kolam) dan pemilik
// kolam (cuma kolamnya sendiri -- otorisasi dicek di pemanggil).
export async function createTemplateRecord(formData: FormData): Promise<{ error: string } | null> {

  const poolId = formData.get("poolId") as string;
  const name = toProperCase(formData.get("name")?.toString().trim() ?? "");
  const totalSesi = Number(formData.get("totalSesi"));
  const price = Number(formData.get("price"));
  const durationDays = Number(formData.get("durationDays"));
  const jatahCancel = Number(formData.get("jatahCancel"));

  if (
    !poolId ||
    !name ||
    !Number.isInteger(totalSesi) || totalSesi < 1 ||
    !Number.isFinite(price) || price < 0 ||
    !Number.isInteger(durationDays) || durationDays < 1 ||
    !Number.isInteger(jatahCancel) || jatahCancel < 0
  ) {
    return { error: "Kolam & nama wajib diisi, total sesi/durasi minimal 1, harga & jatah cancel tidak boleh negatif" };
  }

  // Nama paket unik per kolam; dicek di dalam lock biar klik ganda tidak
  // bikin 2 katalog kembar.
  const created = await withDedupeLock(`template:${poolId}`, async (tx) => {
    const exists = await tx.packageTemplate.count({ where: { poolId, name } });
    if (exists > 0) return false;
    await tx.packageTemplate.create({ data: { poolId, name, totalSesi, price, durationDays, jatahCancel } });
    return true;
  });
  if (!created) return { error: "Paket dengan nama ini sudah ada di kolam tersebut." };

  return null;
}

export async function updateTemplateRecord(formData: FormData): Promise<{ error: string } | null> {

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
    return { error: "Nama wajib diisi, total sesi/durasi minimal 1, harga & jatah cancel tidak boleh negatif" };
  }

  await prisma.packageTemplate.update({
    where: { id: templateId },
    data: { name, totalSesi, price, durationDays, jatahCancel, isActive },
  });

  return null;
}

