"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDependent, createSelfDependent, assertDependentOwnedByMember } from "@/lib/dependents";
import { toProperCase } from "@/lib/format";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { COACH_SPECIALTIES, type CoachSpecialty } from "@/lib/coach-specialties";
import { isStorageConfigured, validateUpload, extensionFor, uploadObject, publicObjectUrl, PHOTO_BUCKET, CERT_BUCKET, hasMatchingSignature, SIGNATURE_MISMATCH_ERROR } from "@/lib/storage";
import { ageFromBirthDate } from "@/lib/coach-bio";

export type ActionState = { error?: string; success?: boolean } | null;

export async function updateName(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };

  const rawName = formData.get("name")?.toString().trim() ?? "";
  if (!rawName) {
    return { error: "Nama tidak boleh kosong" };
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
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };

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
    return { error: "Konfirmasi password tidak sama" };
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

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  // Sesi ini tetep hidup, sesi lain (perangkat lain / sesi curian) mati.
  await unstable_update({ sessionVersion: updated.sessionVersion });

  return { success: true };
}

export async function addChild(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };
  if (session.user.role !== "MEMBER") return { error: "Hanya member yang bisa menambah anak." };

  const type = formData.get("type")?.toString();
  const name = formData.get("name")?.toString() ?? "";

  try {
    if (type === "self") {
      await createSelfDependent(session.user.id);
    } else {
      await createDependent(session.user.id, name);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menambah peserta" };
  }

  revalidatePath("/profil");
  revalidatePath("/member/peserta");
  return { success: true };
}

export async function toggleChildActive(dependentId: string, isActive: boolean) {
  const session = await auth();
  if (!session) throw new Error("Sesi habis, silakan masuk lagi.");

  await assertDependentOwnedByMember(dependentId, session.user.id);
  await prisma.dependent.update({ where: { id: dependentId }, data: { isActive } });
  revalidatePath("/profil");
  revalidatePath("/member/peserta");
}

// Coach edit bio/keahlian/sertifikasi sendiri -- sebelumnya cuma bisa diisi
// sekali pas daftar, gak ada jalan buat ngubah (padahal ini yang dibaca
// orang tua di halaman /pelatih/[id]).
export async function updateCoachProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };
  if (session.user.role !== "COACH") return { error: "Hanya buat akun coach." };

  const bio = formData.get("bio")?.toString().trim() ?? "";
  const specialties = formData
    .getAll("specialties")
    .map(String)
    .filter((s): s is CoachSpecialty => (COACH_SPECIALTIES as readonly string[]).includes(s));

  if (specialties.length === 0) {
    return { error: "Pilih minimal 1 keahlian." };
  }
  if (bio.length > 500) {
    return { error: "Bio maksimal 500 karakter." };
  }

  const birthDateRaw = formData.get("birthDate")?.toString().trim() ?? "";
  let birthDate: Date | null = null;
  if (birthDateRaw) {
    const parsed = new Date(`${birthDateRaw}T00:00:00+07:00`);
    if (Number.isNaN(parsed.getTime())) return { error: "Tanggal lahir tidak valid." };
    const age = ageFromBirthDate(parsed);
    if (age === null || age < 17 || age > 80) return { error: "Tanggal lahir tidak masuk akal (umur 17-80 tahun)." };
    birthDate = parsed;
  }

  const genderRaw = formData.get("gender")?.toString() ?? "";
  if (genderRaw && genderRaw !== "MALE" && genderRaw !== "FEMALE") return { error: "Jenis kelamin tidak valid." };
  const gender = genderRaw ? (genderRaw as "MALE" | "FEMALE") : null;

  const updated = await prisma.coachProfile.updateMany({
    where: { userId: session.user.id },
    data: {
      bio: bio || null,
      specialties,
      birthDate,
      gender,
    },
  });
  if (updated.count === 0) return { error: "Profil coach tidak ditemukan. Hubungi admin." };

  revalidatePath("/profil");
  revalidatePath(`/pelatih/${session.user.id}`);
  return { success: true };
}

export async function uploadCoachPhoto(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "COACH") return { error: "Hanya buat akun coach." };
  if (!isStorageConfigured()) return { error: "Upload file belum diaktifkan admin." };
  const file = formData.get("photo") as File | null;
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const path = `${session.user.id}/photo.${extensionFor(file!)}`;
  try {
    await uploadObject(PHOTO_BUCKET, path, file!);
  } catch {
    return { error: "Upload foto gagal, coba lagi." };
  }
  // ?v= biar browser gak nampilin foto lama dari cache setelah ganti.
  await prisma.coachProfile.updateMany({
    where: { userId: session.user.id },
    data: { photoUrl: `${publicObjectUrl(PHOTO_BUCKET, path)}?v=${Date.now()}` },
  });
  revalidatePath("/", "layout");
  return { success: true };
}

// Sertifikat baru selalu masuk status PENDING -- badge "Bersertifikat" baru
// tampil setelah admin menyetujui (lihat admin/users/certificate-actions.ts).
export async function uploadCoachCertificate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "COACH") return { error: "Hanya buat akun coach." };
  if (!isStorageConfigured()) return { error: "Upload file belum diaktifkan admin." };
  const file = formData.get("certificate") as File | null;
  const note = formData.get("certificationNote")?.toString().trim() ?? "";
  if (!note) return { error: "Isi nama sertifikat/lembaga." };
  const invalid = validateUpload(file, "certificate");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const path = `${session.user.id}/certificate-${Date.now()}.${extensionFor(file!)}`;
  try {
    await uploadObject(CERT_BUCKET, path, file!);
  } catch {
    return { error: "Upload sertifikat gagal, coba lagi." };
  }
  await prisma.coachProfile.updateMany({
    where: { userId: session.user.id },
    data: { certificateUrl: path, certificationNote: note, certificateStatus: "PENDING", hasCertification: false },
  });
  revalidatePath("/profil");
  return { success: true };
}
