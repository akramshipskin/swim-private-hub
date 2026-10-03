"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSelfDependent } from "@/lib/dependents";
import { readParticipants } from "@/lib/participant-input";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { userErrorMessage } from "@/lib/user-error";

export type ActionState = { error?: string } | null;

export async function changePassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) redirect("/login");
  // Action ini sengaja gak minta password lama -- cuma sah buat akun yang
  // lagi wajib ganti password sementara. Ganti password biasa lewat
  // /profil (updatePasswordProfil) yang verifikasi password lama.
  if (!session.user.mustChangePassword) {
    return { error: "Ganti password lewat menu Profil (butuh password saat ini)." };
  }

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password baru minimal 8 karakter" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password tidak sama" };
  }
  // Password sementara diketahui orang lain (admin yang mereset, CSV import):
  // memakainya lagi = wajib-ganti tidak ada gunanya.
  const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { passwordHash: true } });
  if (current && (await bcrypt.compare(newPassword, current.passwordHash))) {
    return { error: "Password baru harus berbeda dari password sementara." };
  }

  // Cuma role MEMBER yang punya konsep peserta (diri sendiri/anak) --
  // admin/coach skip step ini. Wajib isi minimal 1 peserta, digabung 1
  // transaction sama ganti password biar atomic (gak ada state "password
  // udah ganti tapi peserta belom keisi" kalau salah satu gagal).
  // Tanggal lahir tiap peserta wajib (keputusan Hadi 30 Sep) -- dicek sebelum
  // apa pun diubah, jadi salah isi tidak meninggalkan password setengah ganti.
  let participants: ReturnType<typeof readParticipants>;
  try {
    participants = readParticipants(formData);
  } catch (err) {
    return { error: userErrorMessage(err, "Tanggal lahir peserta tidak valid.") };
  }
  const { children, wantsSelf, selfBirthDate } = participants;

  // Wajib isi peserta cuma kalau member ini belum punya peserta sama sekali
  // (login pertama). Member yang password-nya direset admin udah punya.
  const needsParticipants =
    session.user.role === "MEMBER" &&
    (await prisma.dependent.count({ where: { memberId: session.user.id, isActive: true } })) === 0;
  if (needsParticipants && children.length === 0 && !wantsSelf) {
    return { error: "Isi minimal 1 peserta (diri sendiri atau anak)." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: session.user.id },
      data: { passwordHash, mustChangePassword: false, sessionVersion: { increment: 1 } },
      select: { sessionVersion: true },
    });
    if (children.length > 0) {
      await tx.dependent.createMany({
        data: children.map((c) => ({ memberId: session.user.id, name: c.name, birthDate: c.birthDate })),
      });
    }
    if (wantsSelf) {
      const self = await createSelfDependent(session.user.id, tx);
      await tx.dependent.update({ where: { id: self.id }, data: { birthDate: selfBirthDate } });
    }
    return u;
  });

  await unstable_update({ user: { mustChangePassword: false }, sessionVersion: updated.sessionVersion });

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
