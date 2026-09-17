"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSelfDependent } from "@/lib/dependents";
import { toProperCase } from "@/lib/format";
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
    return { error: "Konfirmasi password tidak sama" };
  }

  // Cuma role MEMBER yang punya konsep peserta (diri sendiri/anak) --
  // admin/coach skip step ini. Wajib isi minimal 1 peserta, digabung 1
  // transaction sama ganti password biar atomic (gak ada state "password
  // udah ganti tapi peserta belom keisi" kalau salah satu gagal).
  const types = formData.getAll("participantType").map(String);
  const names = formData.getAll("participantName").map(String);
  const childNames = types
    .map((t, i) => (t === "child" ? names[i]?.trim() : null))
    .filter((n): n is string => !!n)
    .map((n) => toProperCase(n));
  const wantsSelf = types.includes("self");

  // Wajib isi peserta cuma kalau member ini belum punya peserta sama sekali
  // (login pertama). Member yang password-nya direset admin udah punya.
  const needsParticipants =
    session.user.role === "MEMBER" &&
    (await prisma.dependent.count({ where: { memberId: session.user.id, isActive: true } })) === 0;
  if (needsParticipants && childNames.length === 0 && !wantsSelf) {
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

  // Record<Role, string> (bukan Record<string, string>) sengaja -- biar
  // TypeScript maksa tiap role kekasih entry, gak ada yang keskip diem-diem
  // kalau ada role baru (ini yang bikin POOL_OWNER pernah ketinggalan di
  // sini padahal udah ada di roleHome-nya src/app/page.tsx).
  const roleHome: Record<"ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER", string> = {
    ADMIN: "/admin",
    COACH: "/coach/dashboard",
    MEMBER: "/member/booking",
    POOL_OWNER: "/pool/dashboard",
  };
  redirect(roleHome[session.user.role]);
}
