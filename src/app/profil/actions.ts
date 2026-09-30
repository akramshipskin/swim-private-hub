"use server";

import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDependent, createSelfDependent, assertDependentOwnedByMember, parseParticipantBirthDate } from "@/lib/dependents";
import { toProperCase, MAX_PERSON_NAME_LENGTH } from "@/lib/format";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { COACH_SPECIALTIES, type CoachSpecialty } from "@/lib/coach-specialties";
import { isStorageConfigured, validateUpload, extensionFor, uploadObject, publicObjectUrl, PHOTO_BUCKET, CERT_BUCKET, hasMatchingSignature, SIGNATURE_MISMATCH_ERROR, removeObject } from "@/lib/storage";
import { MAX_CERTIFICATES_PER_COACH } from "@/lib/coach-certificates";
import { parseCoachBirthDate } from "@/lib/coach-bio";
import { notifyAdmins } from "@/lib/notify";

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
  if (rawName.length > MAX_PERSON_NAME_LENGTH) {
    return { error: `Nama maksimal ${MAX_PERSON_NAME_LENGTH} karakter.` };
  }
  const name = toProperCase(rawName);

  // Peserta "diri sendiri" (Dependent.isSelf) menyalin nama akun saat dibuat;
  // ikut diperbarui supaya dropdown booking & dashboard tidak menampilkan
  // nama lama. Role selain MEMBER tidak punya Dependent (updateMany = 0 baris).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    }),
    prisma.dependent.updateMany({
      where: { memberId: session.user.id, isSelf: true },
      data: { name },
    }),
  ]);

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
    // Tanggal lahir wajib untuk peserta baru (keputusan Hadi 29 Sep: level
    // milestone per umur, anak maupun dewasa).
    const birthDate = parseParticipantBirthDate(formData.get("birthDate")?.toString().trim() ?? "");
    if (type === "self") {
      const self = await createSelfDependent(session.user.id);
      await prisma.dependent.update({ where: { id: self.id }, data: { birthDate } });
    } else {
      await createDependent(session.user.id, name, prisma, birthDate);
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menambah peserta" };
  }

  revalidatePath("/profil");
  revalidatePath("/member/peserta");
  return { success: true };
}

// Isi/ubah tanggal lahir peserta yang sudah ada (peserta lama dibuat sebelum
// tanggal lahir wajib, termasuk yang dibuat otomatis saat daftar).
export async function setDependentBirthDate(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "Sesi habis, silakan masuk lagi." };
  if (session.user.role !== "MEMBER") return { error: "Hanya member yang bisa mengubah data peserta." };
  const dependentId = formData.get("dependentId")?.toString() ?? "";
  try {
    await assertDependentOwnedByMember(dependentId, session.user.id);
    const birthDate = parseParticipantBirthDate(formData.get("birthDate")?.toString().trim() ?? "");
    await prisma.dependent.update({ where: { id: dependentId }, data: { birthDate } });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Gagal menyimpan tanggal lahir" };
  }
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
    try {
      birthDate = parseCoachBirthDate(birthDateRaw);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Tanggal lahir tidak valid." };
    }
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
  if (!isStorageConfigured()) return { error: "Unggah file belum diaktifkan admin." };
  const file = formData.get("photo") as File | null;
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const path = `${session.user.id}/photo.${extensionFor(file!)}`;
  try {
    await uploadObject(PHOTO_BUCKET, path, file!);
  } catch {
    return { error: "Unggah foto gagal, coba lagi." };
  }
  // ?v= biar browser gak nampilin foto lama dari cache setelah ganti.
  await prisma.coachProfile.updateMany({
    where: { userId: session.user.id },
    data: { photoUrl: `${publicObjectUrl(PHOTO_BUCKET, path)}?v=${Date.now()}` },
  });
  revalidatePath("/", "layout");
  return { success: true };
}

const LIMIT_ERROR = `Maksimal ${MAX_CERTIFICATES_PER_COACH} sertifikat. Hapus yang lama dulu.`;

// Tambah 1 sertifikat (coach bisa punya banyak, maks MAX_CERTIFICATES_PER_COACH).
// Selalu masuk PENDING -- badge "Bersertifikat" baru tampil setelah admin
// menyetujui minimal satu (lihat admin/users/certificate-actions.ts).
export async function uploadCoachCertificate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "COACH") return { error: "Hanya buat akun coach." };
  if (!isStorageConfigured()) return { error: "Unggah file belum diaktifkan admin." };
  const file = formData.get("certificate") as File | null;
  const name = formData.get("certificateName")?.toString().trim().slice(0, 120) ?? "";
  if (!name) return { error: "Isi nama sertifikat/lembaga." };
  const invalid = validateUpload(file, "certificate");
  if (invalid) return { error: invalid };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, _count: { select: { certificates: true } } },
  });
  if (!profile) return { error: "Profil coach tidak ditemukan. Hubungi admin." };
  if (profile._count.certificates >= MAX_CERTIFICATES_PER_COACH) return { error: LIMIT_ERROR };

  const path = `${session.user.id}/certificate-${Date.now()}.${extensionFor(file!)}`;
  try {
    await uploadObject(CERT_BUCKET, path, file!);
  } catch {
    return { error: "Unggah sertifikat gagal, coba lagi." };
  }
  // Cek batas diulang di dalam kunci baris profil: 2 unggahan barengan saat
  // sisa slot 1 tidak boleh sama-sama lolos.
  const created = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "CoachProfile" WHERE id = ${profile.id} FOR UPDATE`;
    const count = await tx.coachCertificate.count({ where: { coachProfileId: profile.id } });
    if (count >= MAX_CERTIFICATES_PER_COACH) return false;
    await tx.coachCertificate.create({ data: { coachProfileId: profile.id, name, filePath: path } });
    return true;
  });
  if (!created) {
    await removeObject(CERT_BUCKET, path);
    return { error: LIMIT_ERROR };
  }
  await notifyAdmins("Sertifikat coach menunggu", `${session.user.name ?? "Coach"} mengunggah "${name}"`, `/admin/users/${session.user.id}`);
  revalidatePath("/profil");
  return { success: true };
}


// Coach menghapus sertifikatnya sendiri (status apa pun). Kalau itu satu-
// satunya yang disetujui, badge "Bersertifikat" ikut hilang.
// Sertifikat milik coach lain / sudah terhapus = diam saja (tidak ada yang
// perlu ditampilkan; daftar di Profil langsung diperbarui).
export async function deleteCoachCertificate(certificateId: string): Promise<void> {
  const session = await auth();
  if (!session || session.user.role !== "COACH") return;
  const cert = await prisma.coachCertificate.findFirst({
    where: { id: certificateId, coachProfile: { userId: session.user.id } },
    select: { id: true, filePath: true },
  });
  if (!cert) return;
  await prisma.coachCertificate.deleteMany({ where: { id: cert.id } });
  if (cert.filePath) await removeObject(CERT_BUCKET, cert.filePath);
  revalidatePath("/", "layout");
}

// Gambar tanda tangan coach untuk sertifikat level milestone. Diunggah sekali
// (unggah ulang = mengganti). Bucket privat; dibuka lewat signed URL.
export async function uploadCoachSignature(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "COACH") return { error: "Hanya buat akun coach." };
  if (!isStorageConfigured()) return { error: "Unggah file belum diaktifkan admin." };
  const file = formData.get("signature") as File | null;
  const invalid = validateUpload(file, "photo");
  if (invalid) return { error: invalid.replace("Foto", "Tanda tangan") };
  if (!(await hasMatchingSignature(file!))) return { error: SIGNATURE_MISMATCH_ERROR };

  const path = `${session.user.id}/signature-${Date.now()}.${extensionFor(file!)}`;
  try {
    await uploadObject(CERT_BUCKET, path, file!);
  } catch {
    return { error: "Unggah tanda tangan gagal, coba lagi." };
  }
  const old = await prisma.coachProfile.findUnique({ where: { userId: session.user.id }, select: { signaturePath: true } });
  await prisma.coachProfile.updateMany({ where: { userId: session.user.id }, data: { signaturePath: path } });
  if (old?.signaturePath) await removeObject(CERT_BUCKET, old.signaturePath);
  revalidatePath("/profil");
  return { success: true };
}
