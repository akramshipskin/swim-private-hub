"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

export type ActionState = { error?: string } | null;

export async function createUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = (formData.get("email") as string) || null;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "COACH" | "MEMBER";

  if (!name || !phone || !password || !role) {
    return { error: "Nama, No HP, password, dan role wajib diisi" };
  }
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter" };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    return { error: "No HP atau email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role,
      ...(role === "COACH" ? { coachProfile: { create: {} } } : {}),
    },
  });

  revalidatePath("/admin/users");
  return null;
}

const IMPORT_DEFAULT_PASSWORD = "renang2026";

export type ImportState = { error?: string; result?: string } | null;

export async function importMembersXlsx(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  await requireRole("ADMIN");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Pilih file xlsx dulu" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, unknown>[];
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(firstSheet);
  } catch {
    return { error: "Gagal baca file. Pastikan format xlsx valid." };
  }

  if (rows.length === 0) {
    return { error: "File kosong atau gak ada data di sheet pertama." };
  }

  // Header fleksibel: "Nama"/"nama"/"NAMA", "No HP"/"no hp"/"HP"/"Nomor HP", dst.
  function pick(row: Record<string, unknown>, candidates: string[]) {
    const keys = Object.keys(row);
    for (const c of candidates) {
      const key = keys.find((k) => k.trim().toLowerCase() === c);
      if (key && row[key] != null && String(row[key]).trim() !== "") {
        return String(row[key]).trim();
      }
    }
    return null;
  }

  const passwordHash = await bcrypt.hash(IMPORT_DEFAULT_PASSWORD, 12);

  let created = 0;
  const skipped: string[] = [];

  for (const row of rows) {
    const name = pick(row, ["nama", "name"]);
    const rawPhone = pick(row, ["no hp", "nomor hp", "hp", "phone", "no. hp", "no telepon"]);

    if (!name || !rawPhone) {
      skipped.push(`Baris tanpa nama/HP lengkap dilewati`);
      continue;
    }

    const phone = rawPhone.replace(/[^\d+]/g, "");

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      skipped.push(`${name} (${phone}) -- HP udah terdaftar`);
      continue;
    }

    await prisma.user.create({
      data: {
        name,
        phone,
        email: null,
        passwordHash,
        role: "MEMBER",
        mustChangePassword: true,
      },
    });
    created++;
  }

  revalidatePath("/admin/users");

  const parts = [`${created} member berhasil diimport.`];
  if (skipped.length > 0) {
    parts.push(`${skipped.length} dilewati: ${skipped.slice(0, 5).join("; ")}${skipped.length > 5 ? "..." : ""}`);
  }
  parts.push(`Password default semua: "${IMPORT_DEFAULT_PASSWORD}" -- kasih tau member, mereka wajib ganti pas login pertama.`);

  return { result: parts.join(" ") };
}

export async function toggleUserActive(userId: string, nextActive: boolean) {
  await requireRole("ADMIN");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
  });

  revalidatePath("/admin/users");
}
