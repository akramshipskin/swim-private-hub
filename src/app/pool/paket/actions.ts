"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createTemplateRecord, updateTemplateRecord } from "@/lib/package-template";

export type ActionState = { error?: string } | null;

// Pemilik kolam mengatur harga paket kolamnya sendiri, langsung berlaku
// (tanpa persetujuan admin). Paket yang sudah dibeli tidak ikut berubah.
async function ownsPool(userId: string, poolId: string) {
  return (await prisma.poolOwnership.count({ where: { poolId, ownerId: userId } })) > 0;
}

export async function createPoolTemplate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("POOL_OWNER");
  const poolId = formData.get("poolId")?.toString() ?? "";
  if (!(await ownsPool(session.user.id, poolId))) return { error: "Kamu tidak punya akses ke kolam ini." };
  const res = await createTemplateRecord(formData);
  if (res) return res;
  revalidatePath("/pool/paket");
  revalidatePath("/admin/paket");
  return null;
}

export async function updatePoolTemplate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireRole("POOL_OWNER");
  const template = await prisma.packageTemplate.findUnique({
    where: { id: formData.get("templateId")?.toString() ?? "" },
    select: { poolId: true },
  });
  if (!template || !(await ownsPool(session.user.id, template.poolId))) {
    return { error: "Kamu tidak punya akses ke paket ini." };
  }
  const res = await updateTemplateRecord(formData);
  if (res) return res;
  revalidatePath("/pool/paket");
  revalidatePath("/admin/paket");
  return null;
}
