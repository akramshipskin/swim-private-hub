"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { identityTakenWhere, normalizeEmail, normalizePhone, toProperCase } from "@/lib/format";
import { MAX_ADDRESS, MAX_EMAIL, MAX_NAME, MAX_POOL_NAME } from "@/lib/register-input";
import { createSelfDependent } from "@/lib/dependents";
import { readParticipants } from "@/lib/participant-input";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { userErrorMessage } from "@/lib/user-error";

export type ActionState = { error?: string; success?: string } | null;

export async function createUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const rawName = formData.get("name") as string;
  const phone = normalizePhone((formData.get("phone") as string | null) ?? "");
  const email = normalizeEmail(formData.get("email") as string | null);
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";

  if (!rawName?.trim() || !phone || !password || !role) {
    return { error: "Nama, No HP, password, dan role wajib diisi" };
  }
  if (rawName.trim().length > MAX_NAME) return { error: `Nama maksimal ${MAX_NAME} karakter.` };
  if (email && email.length > MAX_EMAIL) return { error: `Email maksimal ${MAX_EMAIL} karakter.` };
  const name = toProperCase(rawName.trim());
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter" };
  }

  // Samain kayak halaman daftar member sendiri -- kalau bikin akun Member,
  // wajib pilih minimal 1 peserta (diri sendiri/anak) dari sini juga.
  let wantsSelf = false;
  let selfBirthDate: Date | null = null;
  let children: { name: string; birthDate: Date }[] = [];
  if (role === "MEMBER") {
    try {
      ({ wantsSelf, selfBirthDate, children } = readParticipants(formData));
    } catch (err) {
      return { error: userErrorMessage(err, "Tanggal lahir peserta tidak valid.") };
    }
    if (children.length === 0 && !wantsSelf) {
      return { error: "Pilih minimal 1 peserta (diri sendiri atau anak)" };
    }
  }

  const poolMode = formData.get("poolMode")?.toString();
  const poolId = formData.get("poolId")?.toString() ?? "";
  const newPoolName = formData.get("newPoolName")?.toString().trim() ?? "";
  const newPoolAddress = formData.get("newPoolAddress")?.toString().trim() ?? "";
  if (role === "POOL_OWNER") {
    if (newPoolName.length > MAX_POOL_NAME || newPoolAddress.length > MAX_ADDRESS) {
      return { error: `Nama kolam maksimal ${MAX_POOL_NAME} karakter, alamat maksimal ${MAX_ADDRESS} karakter.` };
    }
    if (poolMode === "new" ? !newPoolName : !poolId) {
      return { error: "Pilih kolam yang ada atau isi nama kolam baru" };
    }
    if (poolMode !== "new" && (await prisma.pool.count({ where: { id: poolId } })) === 0) {
      return { error: "Kolam tidak ditemukan" };
    }
  }

  const existing = await prisma.user.findFirst({ where: identityTakenWhere(phone, email) });
  if (existing) {
    return { error: "No HP atau email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role,
          // Dibuat admin = sudah disetujui (tidak masuk daftar "menunggu").
          approvedAt: new Date(),
          // MEMBER wajib ganti password pas login pertama.
          ...(role === "MEMBER" ? { mustChangePassword: true } : {}),
          ...(role === "COACH" ? { coachProfile: { create: {} } } : {}),
        },
      });
      if (children.length > 0) {
        await tx.dependent.createMany({
          data: children.map((c) => ({ memberId: created.id, name: c.name, birthDate: c.birthDate })),
        });
      }
      if (wantsSelf) {
        const self = await createSelfDependent(created.id, tx);
        await tx.dependent.update({ where: { id: self.id }, data: { birthDate: selfBirthDate } });
      }
      if (role === "POOL_OWNER") {
        const pool =
          poolMode === "new"
            ? await tx.pool.create({ data: { name: newPoolName, address: newPoolAddress || null, isActive: true } })
            : { id: poolId };
        await tx.poolOwnership.create({ data: { poolId: pool.id, ownerId: created.id } });
      }
    });
  } catch (err) {
    // Double-submit barengan: 2 request lolos cek `existing` di atas, yang
    // kalah kena unique constraint -- dulu jadi halaman error.
    if ((err as { code?: string })?.code === "P2002") {
      return { error: "No HP atau email sudah terdaftar" };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  // Bukan null: null = keadaan awal form, jadi dulu sukses tidak terlihat
  // (form tetap terisi, admin mengira gagal lalu kirim ulang -> "sudah terdaftar").
  return { success: `Akun ${name} dibuat.${role === "MEMBER" ? " Wajib ganti password saat masuk pertama." : ""}` };
}

export async function toggleUserActive(userId: string, nextActive: boolean) {
  const session = await requireRole("ADMIN");
  // Guard server-side juga (tombolnya udah disembunyiin buat diri sendiri).
  if (userId === session.user.id && !nextActive) return;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
    select: { role: true },
  });
  // Aktifkan pertama kali = persetujuan pendaftaran (penanda "menunggu
  // persetujuan" di dashboard hilang). Tidak menimpa tanggal lama.
  if (nextActive) {
    const firstApproval = await prisma.user.updateMany({ where: { id: userId, approvedAt: null }, data: { approvedAt: new Date() } });
    // Pemilik kolam yang baru didaftarkan: kolamnya ikut dinyalakan (dulu admin
    // harus klik Setujui dua kali, di Pengguna lalu di Kolam). Hanya saat
    // persetujuan PERTAMA, jadi kolam yang sengaja dinonaktifkan nanti tidak
    // ikut menyala saat pemilik diaktifkan ulang.
    if (firstApproval?.count > 0 && user.role === "POOL_OWNER") {
      await prisma.pool.updateMany({ where: { isActive: false, ownerships: { some: { ownerId: userId } } }, data: { isActive: true } });
      revalidatePath("/admin/kolam");
    }
  }

  // Coach dinonaktifkan: booking yang BELUM dimulai dibatalkan otomatis
  // sebagai pembatalan admin (keputusan Hadi D2) -- sesi member kembali dan
  // member dapat notifikasi. Sesi yang sudah lewat tidak disentuh (urusan
  // absensi). Aman dari booking yang menyelip: booking mengunci baris coach
  // (FOR SHARE) dan update di atas menunggunya, jadi daftar di bawah sudah
  // mencakup booking itu; booking setelahnya ditolak karena coach nonaktif.
  if (!nextActive && user.role === "COACH") {
    const upcoming = await prisma.booking.findMany({
      where: { status: "BOOKED", attended: null, availability: { coachId: userId, startTime: { gt: new Date() } } },
      select: { id: true },
    });
    for (const b of upcoming) {
      try {
        await cancelBooking({ bookingId: b.id, actor: { role: "ADMIN" } });
      } catch (err) {
        // Sudah dibatalkan/ditandai di tempat lain di antaranya -- lewati.
        if (!(err instanceof CancelError)) throw err;
      }
    }
    revalidatePath("/admin/booking-overview");
  }

  revalidatePath("/admin/users");
}

// Alfabet tanpa karakter yang gampang ketuker pas dibaca/diketik ulang
// dari chat WA (0/O, 1/l/I).
const TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newTempPassword() {
  return Array.from({ length: 10 }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]).join("");
}

// Admin reset password user yang lupa -- gak ada "lupa password" mandiri.
// Password sementara acak dibalikin ke admin (buat dikirim lewat WA), dan
// mustChangePassword dipaksa true: user wajib bikin password baru pas login
// (session yang lagi kebuka juga ikut kepaksa, lihat jwt callback di auth.ts).
export async function resetUserPassword(
  userId: string
): Promise<{ tempPassword?: string; error?: string }> {
  const session = await requireRole("ADMIN");
  if (userId === session.user.id) {
    return { error: "Ganti password akunmu sendiri lewat halaman Profil." };
  }

  const tempPassword = newTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const updated = await prisma.user.updateMany({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true, sessionVersion: { increment: 1 } },
  });
  if (updated.count === 0) {
    return { error: "User tidak ditemukan." };
  }
  return { tempPassword };
}

// Reset 2FA coach/member/pemilik kolam yang kehilangan HP. Setelah ini mereka
// masuk pakai password saja (bisa pasang 2FA lagi dari Profil). Semua sesi
// yang terbuka ikut keluar. Akun admin TIDAK lewat sini (2FA admin wajib;
// reset lewat scripts/reset-admin-2fa.mts).
export async function resetUserTotp(userId: string): Promise<{ error?: string }> {
  await requireRole("ADMIN");
  const res = await prisma.user.updateMany({
    where: { id: userId, role: { not: "ADMIN" } },
    data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, sessionVersion: { increment: 1 } },
  });
  if (res.count === 0) return { error: "User tidak ditemukan, atau akun admin (reset admin lewat skrip server)." };
  revalidatePath(`/admin/users/${userId}`);
  return {};
}
