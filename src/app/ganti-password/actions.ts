"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSelfDependent } from "@/lib/dependents";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type ActionState = { error?: string } | null;

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) redirect("/login");

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password baru minimal 8 karakter" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password gak sama" };
  }

  // Cuma role MEMBER yang punya konsep peserta (diri sendiri/anak) --
  // admin/coach skip step ini. Wajib isi minimal 1 peserta, digabung 1
  // transaction sama ganti password biar atomic (gak ada state "password
  // udah ganti tapi peserta belom keisi" kalau salah satu gagal).
  const types = formData.getAll("participantType").map(String);
  const names = formData.getAll("participantName").map(String);
  const childNames = types
    .map((t, i) => (t === "child" ? names[i]?.trim() : null))
    .filter((n): n is string => !!n);
  const wantsSelf = types.includes("self");

  if (session.user.role === "MEMBER" && childNames.length === 0 && !wantsSelf) {
    return { error: "Isi minimal 1 peserta (diri sendiri atau anak)" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { passwordHash, mustChangePassword: false },
    });
    if (childNames.length > 0) {
      await tx.dependent.createMany({
        data: childNames.map((name) => ({ memberId: session.user.id, name })),
      });
    }
    if (wantsSelf) {
      await createSelfDependent(session.user.id, tx);
    }
  });

  await unstable_update({ user: { mustChangePassword: false } });

  const roleHome: Record<string, string> = {
    ADMIN: "/admin",
    COACH: "/coach",
    MEMBER: "/member/booking",
  };
  redirect(roleHome[session.user.role]);
}
