"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { newTotpSecret, verifyTotp } from "@/lib/totp";

export type TotpState = { error?: string } | null;

// Sengaja pakai auth() langsung, bukan requireRole("ADMIN"): requireRole
// mengarahkan admin tanpa 2FA ke halaman ini -- memakainya di sini = putaran.
async function adminWithout2fa() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/login");
  if (session.user.mustChangePassword) redirect("/ganti-password");
  return session.user.id;
}

export async function startTotpSetup(): Promise<void> {
  const userId = await adminWithout2fa();
  // Kunci baru hanya selama 2FA belum aktif (kalau sudah aktif, reset lewat
  // scripts/reset-admin-2fa.mts -- bukan dari sesi yang mungkin dicuri).
  await prisma.user.updateMany({
    where: { id: userId, totpEnabledAt: null },
    data: { totpSecret: newTotpSecret() },
  });
  revalidatePath("/keamanan");
}

export async function confirmTotpSetup(_prev: TotpState, formData: FormData): Promise<TotpState> {
  const userId = await adminWithout2fa();
  const code = (formData.get("code") as string | null) ?? "";

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { totpSecret: true, totpEnabledAt: true } });
  if (user?.totpEnabledAt) redirect("/admin");
  if (!user?.totpSecret) return { error: "Buat kunci dulu." };

  const step = verifyTotp(user.totpSecret, code);
  if (step === null) {
    return { error: "Kode salah. Pastikan jam HP otomatis, lalu ketik 6 digit yang sedang tampil." };
  }

  // Kunci yang dikonfirmasi harus kunci yang barusan dicek (bukan kunci baru
  // dari tab lain yang menekan "Buat kunci" di antaranya).
  const enabled = await prisma.user.updateMany({
    where: { id: userId, totpEnabledAt: null, totpSecret: user.totpSecret },
    data: { totpEnabledAt: new Date(), totpLastStep: step },
  });
  if (enabled.count === 0) return { error: "Kunci berubah di tab lain. Muat ulang halaman ini." };

  redirect("/admin");
}
