"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { newTotpSecret, verifyTotp } from "@/lib/totp";
import { forgetAttempts, takeAttempt, LOGIN_FAILS_PER_ACCOUNT, LOGIN_WINDOW_MS } from "@/lib/rate-limit";

export type TotpState = { error?: string } | null;

// Sengaja pakai auth() langsung, bukan requireRole: requireRole mengarahkan
// admin tanpa 2FA ke halaman ini -- memakainya di sini = putaran. Semua peran
// boleh (admin wajib, coach/member/pemilik kolam opsional).
async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");
  return { id: session.user.id, role: session.user.role };
}

const doneUrl = (role: string) => (role === "ADMIN" ? "/admin" : "/profil");

export async function startTotpSetup(): Promise<void> {
  const { id } = await currentUser();
  // Kunci baru hanya selama 2FA belum aktif (kalau sudah aktif: coach/member/
  // pemilik kolam menonaktifkan sendiri dengan password + kode, atau admin
  // mereset; admin lewat scripts/reset-admin-2fa.mts -- bukan dari sesi yang
  // mungkin dicuri).
  await prisma.user.updateMany({
    where: { id, totpEnabledAt: null },
    data: { totpSecret: newTotpSecret() },
  });
  revalidatePath("/keamanan");
}

export async function confirmTotpSetup(_prev: TotpState, formData: FormData): Promise<TotpState> {
  const { id, role } = await currentUser();
  const code = (formData.get("code") as string | null) ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  if (!password) return { error: "Isi password akunmu." };

  const user = await prisma.user.findUnique({ where: { id }, select: { passwordHash: true, totpSecret: true, totpEnabledAt: true } });
  if (user?.totpEnabledAt) redirect(doneUrl(role));
  if (!user?.totpSecret) return { error: "Buat kunci dulu." };

  // Password wajib (keputusan Hadi 25 Sep): tanpa ini, orang yang memegang
  // sesi yang tertinggal terbuka (HP dipinjam) bisa memasang 2FA miliknya
  // sendiri dan pemilik akun terkunci di luar. Hanya password SALAH yang
  // dihitung (3x / 15 menit, sama dengan login); kode salah tidak.
  const key = `totp-on:${id}`;
  const hit = await takeAttempt(key, LOGIN_FAILS_PER_ACCOUNT, LOGIN_WINDOW_MS);
  if (!hit) return { error: "Terlalu banyak password salah. Tunggu 15 menit, lalu coba lagi." };
  if (!(await bcrypt.compare(password, user.passwordHash))) return { error: "Password salah." };
  await forgetAttempts({ ids: [hit] });

  const step = verifyTotp(user.totpSecret, code);
  if (step === null) {
    return { error: "Kode salah. Pastikan jam HP otomatis, lalu ketik 6 digit yang sedang tampil." };
  }

  // Kunci yang dikonfirmasi harus kunci yang barusan dicek (bukan kunci baru
  // dari tab lain yang menekan "Buat kunci" di antaranya).
  const enabled = await prisma.user.updateMany({
    where: { id, totpEnabledAt: null, totpSecret: user.totpSecret },
    data: { totpEnabledAt: new Date(), totpLastStep: step },
  });
  if (enabled.count === 0) {
    // Tab lain barusan mengaktifkan dengan kunci yang sama -> sudah beres.
    const now = await prisma.user.findUnique({ where: { id }, select: { totpEnabledAt: true } });
    if (now?.totpEnabledAt) redirect(doneUrl(role));
    return { error: "Kunci berubah di tab lain. Muat ulang halaman ini." };
  }

  redirect(doneUrl(role));
}

// Menonaktifkan 2FA sendiri: wajib password + kode saat ini (sesi yang dicuri
// saja tidak cukup). Admin tidak bisa (2FA admin wajib; reset lewat skrip).
export async function disableTotp(_prev: TotpState, formData: FormData): Promise<TotpState> {
  const { id, role } = await currentUser();
  if (role === "ADMIN") return { error: "2FA wajib untuk admin." };
  const password = (formData.get("password") as string | null) ?? "";
  const code = (formData.get("code") as string | null) ?? "";
  if (!password || !code) return { error: "Isi password dan kode 6 digit." };

  // Batas salah sama dengan login (3x / 15 menit), supaya form ini tidak
  // jadi jalan menebak password dari sesi yang tertinggal terbuka.
  const key = `totp-off:${id}`;
  if (!(await takeAttempt(key, LOGIN_FAILS_PER_ACCOUNT, LOGIN_WINDOW_MS))) {
    return { error: "Terlalu banyak percobaan salah. Tunggu 15 menit, lalu coba lagi." };
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: { passwordHash: true, totpSecret: true, totpEnabledAt: true },
  });
  if (!user.totpEnabledAt || !user.totpSecret) redirect("/profil");
  if (!(await bcrypt.compare(password, user.passwordHash))) return { error: "Password salah." };
  const step = verifyTotp(user.totpSecret, code);
  if (step === null) return { error: "Kode salah atau sudah kedaluwarsa. Ketik kode yang sedang tampil." };

  // Satu UPDATE atomik: kunci masih yang dicek tadi, dan kodenya belum pernah
  // dipakai (login dengan kode yang sama barengan -> hanya satu yang menang).
  // totpLastStep sengaja DIBIARKAN = langkah ini: kode yang sama tetap tidak
  // bisa dipakai lagi.
  const off = await prisma.user.updateMany({
    where: { id, totpSecret: user.totpSecret, totpEnabledAt: { not: null }, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpSecret: null, totpEnabledAt: null, totpLastStep: step },
  });
  if (off.count === 0) return { error: "Kode ini sudah dipakai. Tunggu kode berikutnya di aplikasi." };

  await forgetAttempts({ key });
  redirect("/profil");
}
