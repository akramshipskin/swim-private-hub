import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { forgetAttempts, takeAttempt, PASSWORD_CONFIRM_FAILS, LOGIN_WINDOW_MS } from "@/lib/rate-limit";
import { notifyAdmins, notifyUser } from "@/lib/notify";

// Ganti rekening penarikan (Hadi 11 Okt, TRD T13): wajib password akun, dan
// pemilik + admin diberi tahu. Tujuannya: sesi yang tertinggal terbuka (HP
// dipinjam) tidak bisa dipakai mengalihkan saldo ke rekening orang lain.
// Hanya password SALAH yang dihitung (3x / 15 menit), sama dengan menu Keamanan.
export async function confirmBankChangePassword(userId: string, password: string): Promise<string | null> {
  if (!password) return "Isi password akunmu untuk mengubah rekening.";
  const hit = await takeAttempt(`bank-change:${userId}`, PASSWORD_CONFIRM_FAILS, LOGIN_WINDOW_MS);
  if (!hit) return "Terlalu banyak password salah. Tunggu 15 menit, lalu coba lagi.";
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return "Password salah.";
  await forgetAttempts({ ids: [hit] });
  return null;
}

export async function notifyBankChanged({ ownerIds, who, bankName, accountNumber, url }: { ownerIds: string[]; who: string; bankName: string; accountNumber: string; url: string }) {
  const tail = accountNumber.slice(-4);
  const body = `Rekening penarikan disimpan: ${bankName} akhiran ${tail}. Bila bukan kamu yang mengubah, segera hubungi admin SPH.`;
  await Promise.all(ownerIds.map((id) => notifyUser(id, "Rekening penarikan disimpan", body, url).catch(() => {})));
  await notifyAdmins("Rekening mitra disimpan", `${who}: rekening penarikan disimpan ${bankName} akhiran ${tail}. Cek sebelum transfer berikutnya.`, "/admin/withdrawals").catch(() => {});
}
