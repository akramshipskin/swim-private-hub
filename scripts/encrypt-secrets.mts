/**
 * Enkripsi kunci 2FA (User.totpSecret) yang masih tersimpan polos.
 * Aman dijalankan berulang: yang sudah terenkripsi dilewati.
 *
 * Urutan deploy (lihat docs/plans/deploy-enkripsi-2fa.md):
 *   1. Isi SECRET_ENCRYPTION_KEY di Vercel (Production), deploy kode baru.
 *   2. Jalankan skrip ini ke production dengan KUNCI YANG SAMA:
 *        set -a; source .env.prod; set +a
 *        DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/encrypt-secrets.mts          # cek saja
 *        DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/encrypt-secrets.mts --apply  # tulis
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { isSealed, openSecret, sealSecret } from "../src/lib/secret-box";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Gagal di awal kalau kunci tidak ada/salah format, sebelum menyentuh data.
openSecret(sealSecret("cek-kunci"));

const users = await prisma.user.findMany({ where: { totpSecret: { not: null } }, select: { id: true, totpSecret: true } });
const plain = users.filter((u) => !isSealed(u.totpSecret!));
console.log(`Kunci 2FA tersimpan: ${users.length}, masih polos: ${plain.length}, sudah terenkripsi: ${users.length - plain.length}`);

if (!apply) {
  console.log("Mode cek saja. Tambahkan --apply untuk mengenkripsi.");
} else {
  let done = 0;
  for (const u of plain) {
    const sealed = sealSecret(u.totpSecret!);
    if (openSecret(sealed) !== u.totpSecret) throw new Error(`Verifikasi gagal untuk user ${u.id}, dihentikan.`);
    // CAS: hanya kalau kuncinya masih nilai polos yang sama (tidak berubah di tengah jalan).
    const res = await prisma.user.updateMany({ where: { id: u.id, totpSecret: u.totpSecret }, data: { totpSecret: sealed } });
    done += res.count;
  }
  console.log(`Selesai: ${done} kunci dienkripsi.`);
}
await prisma.$disconnect();
