"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  await requireRole("ADMIN");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "COACH" | "MEMBER";

  if (!name || !email || !password || !role) {
    throw new Error("Semua field wajib diisi");
  }
  if (password.length < 8) {
    throw new Error("Password minimal 8 karakter");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email sudah terdaftar");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      ...(role === "COACH" ? { coachProfile: { create: {} } } : {}),
    },
  });

  revalidatePath("/admin/users");
}

export async function toggleUserActive(userId: string, nextActive: boolean) {
  await requireRole("ADMIN");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
  });

  revalidatePath("/admin/users");
}
