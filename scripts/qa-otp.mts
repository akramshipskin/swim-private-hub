// Kode 2FA admin untuk uji lokal (QA): cetak kode TOTP saat ini milik akun
// dengan nomor HP tertentu. HANYA untuk DB dev lokal -- menolak jalan kalau
// DATABASE_URL bukan localhost.
//
//   npx tsx --env-file=.env scripts/qa-otp.mts 089900000001
import { prisma } from "../src/lib/prisma";
import { totpAt, currentStep } from "../src/lib/totp";
import { openSecret } from "../src/lib/secret-box";

if (!/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Ditolak: DATABASE_URL bukan database lokal.");
  process.exit(1);
}
const u = await prisma.user.findFirst({ where: { phone: process.argv[2] }, select: { totpSecret: true } });
console.log(u?.totpSecret ? totpAt(openSecret(u.totpSecret), currentStep()) : "NO_SECRET");
process.exit(0);
