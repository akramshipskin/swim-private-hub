"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDependent, createSelfDependent, assertDependentOwnedByMember } from "@/lib/dependents";
import { toProperCase } from "@/lib/format";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type ActionState = { error?: string; success?: boolean } | null;

export async function updateName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, login ulang." };

  const rawName = formData.get("name")?.toString().trim() ?? "";
  if (!rawName) {
    return { error: "Nama gak boleh kosong" };
  }
  const name = toProperCase(rawName);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  });

  await unstable_update({ user: { name } });
  revalidatePath("/profil");
  return { success: true };
}

export async function updatePasswordProfil(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, login ulang." };

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password baru minimal 8 karakter" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password gak sama" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return { success: true };
}

export async function addChild(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, login ulang." };
  if (session.user.role !== "MEMBER") return { error: "Cuma member yang bisa nambah anak." };

  const type = formData.get("type")?.toString();
  const name = formData.get("name")?.toString() ?? "";

  try {
    if (type === "self") {
      await createSelfDependent(session.user.id);
    } else {
      await createDependent(session.user.id, name);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal nambah peserta" };
  }

  revalidatePath("/profil");
  return { success: true };
}

export async function toggleChildActive(dependentId: string, isActive: boolean) {
  const session = await auth();
  if (!session) throw new Error("Sesi habis, login ulang.");

  await assertDependentOwnedByMember(dependentId, session.user.id);
  await prisma.dependent.update({ where: { id: dependentId }, data: { isActive } });
  revalidatePath("/profil");
}
