import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidIndonesianPhone, normalizeEmail, normalizePhone, phoneVariants } from "@/lib/format";
import { clientIp, forgetAttempts, takeAttempt, LOGIN_FAILS_PER_ACCOUNT, LOGIN_FAILS_PER_IP, LOGIN_WINDOW_MS } from "@/lib/rate-limit";
import { verifyTotp } from "@/lib/totp";

// Kode error ini sampai ke browser (signIn(...).code) -- login-form.tsx
// menerjemahkannya ke pesan. Jangan bedakan "HP tidak terdaftar" vs
// "password salah" (itu tetap CredentialsSignin biasa).
export class LockedError extends CredentialsSignin { code = "locked"; }
export class OtpRequiredError extends CredentialsSignin { code = "otp_required"; }
export class OtpInvalidError extends CredentialsSignin { code = "otp_invalid"; }

export async function authorizeCredentials(credentials: Partial<Record<string, unknown>> | undefined, request: Request) {
  const rawIdentifier = (credentials?.identifier as string | undefined)?.trim();
  const password = credentials?.password as string | undefined;
  const otp = (credentials?.otp as string | undefined)?.trim() || "";
  if (!rawIdentifier || !password) return null;

  // Identifier bisa email atau no HP. HP dicari dalam semua bentuk lama
  // (08.., 628.., +628..) supaya akun sebelum pembakuan tetap bisa masuk.
  const isPhone = isValidIndonesianPhone(rawIdentifier.replace(/[\s\-().]/g, ""));
  const identifier = isPhone ? normalizePhone(rawIdentifier) : (normalizeEmail(rawIdentifier) ?? rawIdentifier);

  // Batas salah password (keputusan Hadi 25 Sep): 3x per akun+jaringan
  // -> tunggu 15 menit; plus 20x per jaringan untuk semua akun. Percobaan
  // dicatat SEBELUM cek password (request barengan tidak bisa menebak
  // lebih dari batas), lalu dihapus lagi kalau ternyata berhasil.
  const ip = clientIp(request.headers);
  const accountKey = `login:${identifier}:${ip}`;
  const ipHit = await takeAttempt(`login-ip:${ip}`, LOGIN_FAILS_PER_IP, LOGIN_WINDOW_MS);
  if (!ipHit) throw new LockedError();
  const accountHit = await takeAttempt(accountKey, LOGIN_FAILS_PER_ACCOUNT, LOGIN_WINDOW_MS);
  if (!accountHit) {
    await forgetAttempts({ ids: [ipHit] });
    throw new LockedError();
  }
  const notAFailure = () => forgetAttempts({ ids: [ipHit, accountHit] });

  const user = await prisma.user.findFirst({
    where: isPhone
      ? { phone: { in: [...phoneVariants(identifier), rawIdentifier] } }
      : { email: { equals: identifier, mode: "insensitive" } },
  });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  // Akun nonaktif (coach/pemilik kolam yang belum disetujui) dengan
  // password benar: tetap ditolak, tapi jangan dihitung salah password --
  // mereka wajar mencoba berkali-kali menunggu persetujuan.
  if (!user.isActive) {
    await notAFailure();
    return null;
  }

  // 2FA (wajib untuk admin yang sudah memasangnya). Password benar tapi
  // kode belum diisi -> minta kode, dan percobaan ini tidak dihitung salah.
  if (user.totpEnabledAt && user.totpSecret) {
    if (!otp) {
      await notAFailure();
      throw new OtpRequiredError();
    }
    const step = verifyTotp(user.totpSecret, otp);
    if (step === null) throw new OtpInvalidError();
    // Kode yang sama tidak boleh dipakai dua kali (CAS di langkah waktu).
    const claimed = await prisma.user.updateMany({
      where: { id: user.id, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
      data: { totpLastStep: step },
    });
    if (claimed.count === 0) throw new OtpInvalidError();
  }

  await forgetAttempts({ ids: [ipHit], key: accountKey });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
    sessionVersion: user.sessionVersion,
  };
}
