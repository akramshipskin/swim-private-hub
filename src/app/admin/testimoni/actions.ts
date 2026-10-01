"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-role";
import { TESTIMONIAL_LIMITS } from "@/lib/testimonial";

// Testimoni landing dikelola admin. Semua teks tampil ke publik, jadi wajib
// ada catatan izin (siapa, kapan, lewat apa) sebelum disimpan.
export type TestimonialActionState = { error?: string; success?: boolean } | null;

function readFields(formData: FormData) {
  const get = (k: string) => formData.get(k)?.toString().trim() ?? "";
  const name = get("name");
  const role = get("role");
  const quote = get("quote");
  const consentNote = get("consentNote");
  if (!name || !role || !quote) return { error: "Nama, peran, dan kutipan wajib diisi." };
  if (!consentNote) return { error: "Isi catatan izin (siapa yang mengizinkan, kapan, lewat apa)." };
  for (const [key, max] of Object.entries(TESTIMONIAL_LIMITS)) {
    const value = { name, role, quote, consentNote }[key as keyof typeof TESTIMONIAL_LIMITS];
    if (value.length > max) return { error: `Teks terlalu panjang (maksimal ${max} karakter untuk ${key === "consentNote" ? "catatan izin" : key === "quote" ? "kutipan" : key === "role" ? "peran" : "nama"}).` };
  }
  return { fields: { name, role, quote, consentNote } };
}

function refresh() {
  revalidatePath("/admin/testimoni");
  revalidatePath("/");
}

export async function addTestimonial(_prev: TestimonialActionState, formData: FormData): Promise<TestimonialActionState> {
  await requireRole("ADMIN");
  const r = readFields(formData);
  if ("error" in r) return { error: r.error };
  const last = await prisma.testimonial.aggregate({ _max: { sortOrder: true } });
  // Testimoni baru disembunyikan dulu; admin memeriksa lalu menekan "Tampilkan"
  // (sweeping 2 Okt, no. 19: dulu langsung tampil di landing).
  await prisma.testimonial.create({ data: { ...r.fields, isPublished: false, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
  refresh();
  return { success: true };
}

export async function updateTestimonial(id: string, _prev: TestimonialActionState, formData: FormData): Promise<TestimonialActionState> {
  await requireRole("ADMIN");
  const r = readFields(formData);
  if ("error" in r) return { error: r.error };
  const sortOrder = Number(formData.get("sortOrder"));
  const res = await prisma.testimonial.updateMany({
    where: { id },
    data: { ...r.fields, ...(Number.isInteger(sortOrder) && sortOrder >= 0 && sortOrder <= 999 ? { sortOrder } : {}) },
  });
  if (res.count === 0) return { error: "Testimoni tidak ditemukan." };
  refresh();
  return { success: true };
}

export async function setTestimonialPublished(id: string, isPublished: boolean) {
  await requireRole("ADMIN");
  await prisma.testimonial.updateMany({ where: { id }, data: { isPublished } });
  refresh();
}

export async function deleteTestimonial(id: string) {
  await requireRole("ADMIN");
  await prisma.testimonial.deleteMany({ where: { id } });
  refresh();
}
