"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { MILESTONE_GROUPS, type MilestoneGroup } from "@/lib/milestone";

// Edit butir STANDAR milestone (dependentId null) oleh admin -- H6/P4.
// Sengaja tidak bisa memindah kelompok/level butir yang sudah ada: pencapaian
// peserta menempel ke id butir, jadi memindahnya diam-diam mengacak progres
// level peserta yang sedang berjalan. Pindah = nonaktifkan + tambah butir baru.
// Butir nonaktif tidak dihitung lagi; level yang sudah selesai (dan
// sertifikatnya) tidak berubah.

export type ItemActionState = { error?: string; success?: boolean } | null;

const MAX_TEXT = 200;
const MAX_LEVEL = 10;

function readText(formData: FormData) {
  const text = formData.get("text")?.toString().trim() ?? "";
  if (text.length < 3) return { error: "Teks butir minimal 3 karakter." };
  if (text.length > MAX_TEXT) return { error: `Teks butir maksimal ${MAX_TEXT} karakter.` };
  return { text };
}

function readInt(formData: FormData, key: string, min: number, max: number) {
  const n = Number(formData.get(key));
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function done() {
  revalidatePath("/admin/milestone/butir");
  return { success: true };
}

export async function updateStandardItem(itemId: string, _prev: ItemActionState, formData: FormData): Promise<ItemActionState> {
  await requireRole("ADMIN");
  const t = readText(formData);
  if ("error" in t) return t;
  const sortOrder = readInt(formData, "sortOrder", 0, 999);
  if (sortOrder === null) return { error: "Urutan harus angka 0-999." };
  const r = await prisma.milestoneItem.updateMany({ where: { id: itemId, dependentId: null }, data: { text: t.text, sortOrder } });
  if (r.count === 0) return { error: "Butir standar tidak ditemukan." };
  return done();
}

export async function setStandardItemActive(itemId: string, isActive: boolean) {
  await requireRole("ADMIN");
  await prisma.milestoneItem.updateMany({ where: { id: itemId, dependentId: null }, data: { isActive } });
  revalidatePath("/admin/milestone/butir");
}

export async function addStandardItem(_prev: ItemActionState, formData: FormData): Promise<ItemActionState> {
  const { user } = await requireRole("ADMIN");
  const group = formData.get("group")?.toString() as MilestoneGroup;
  if (!MILESTONE_GROUPS.includes(group)) return { error: "Pilih kelompok." };
  const level = readInt(formData, "level", 1, MAX_LEVEL);
  if (level === null) return { error: `Level harus angka 1-${MAX_LEVEL}.` };
  const t = readText(formData);
  if ("error" in t) return t;
  const last = await prisma.milestoneItem.aggregate({ where: { group, level, dependentId: null }, _max: { sortOrder: true } });
  await prisma.milestoneItem.create({
    data: { group, level, text: t.text, sortOrder: (last._max.sortOrder ?? 0) + 1, createdById: user.id },
  });
  return done();
}
