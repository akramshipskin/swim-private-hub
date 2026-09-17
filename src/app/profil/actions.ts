"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDependent, createSelfDependent, assertDependentOwnedByMember } from "@/lib/dependents";
import { toProperCase } from "@/lib/format";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { COACH_SPECIALTIES, type CoachSpecialty } from "@/lib/coach-specialties";

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

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword) {
    return { error: "Password saat ini wajib diisi" };
  }
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password baru minimal 8 karakter" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password gak sama" };
  }

  // Ganti password dari sini WAJIB verifikasi password lama dulu -- tanpa
  // ini, siapapun yang megang session aktif (komputer bersama yang lupa
  // logout, session ke-curi) bisa diem-diem ganti password dan ngunci
  // pemilik akun aslinya, tanpa perlu tau password lamanya sama sekali.
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Password saat ini salah" };
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

// Coach edit bio/keahlian/sertifikasi sendiri -- sebelumnya cuma bisa diisi
// sekali pas daftar, gak ada jalan buat ngubah (padahal ini yang dibaca
// orang tua di halaman /pelatih/[id]).
export async function updateCoachProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, login ulang." };
  if (session.user.role !== "COACH") return { error: "Cuma buat akun coach." };

  const bio = formData.get("bio")?.toString().trim() ?? "";
  const specialties = formData
    .getAll("specialties")
    .map(String)
    .filter((s): s is CoachSpecialty => (COACH_SPECIALTIES as readonly string[]).includes(s));
  const hasCertification = formData.get("hasCertification") === "on";
  const certificationNote = formData.get("certificationNote")?.toString().trim() ?? "";

  if (specialties.length === 0) {
    return { error: "Pilih minimal 1 keahlian." };
  }
  if (bio.length > 500) {
    return { error: "Bio maksimal 500 karakter." };
  }

  const updated = await prisma.coachProfile.updateMany({
    where: { userId: session.user.id },
    data: {
      bio: bio || null,
      specialties,
      hasCertification,
      certificationNote: hasCertification ? certificationNote || null : null,
    },
  });
  if (updated.count === 0) return { error: "Profil coach gak ditemukan. Hubungi admin." };

  revalidatePath("/profil");
  revalidatePath(`/pelatih/${session.user.id}`);
  return { success: true };
}
