/**
 * Enkripsi kolom rahasia yang masih tersimpan polos:
 *   - User.totpSecret (kunci 2FA)
 *   - CoachProfile / Pool / WithdrawalRequest .bankAccountNumber (nomor rekening)
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
import pg from "pg";
import { isSealed, openSecret, sealSecret } from "../src/lib/secret-box";

const apply = process.argv.includes("--apply");

// Gagal di awal kalau kunci tidak ada/salah format, sebelum menyentuh data.
openSecret(sealSecret("cek-kunci"));

const COLUMNS: [table: string, column: string, label: string][] = [
  ["User", "totpSecret", "Kunci 2FA"],
  ["CoachProfile", "bankAccountNumber", "Rekening coach"],
  ["Pool", "bankAccountNumber", "Rekening kolam"],
  ["WithdrawalRequest", "bankAccountNumber", "Rekening di riwayat pencairan"],
];

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

for (const [table, column, label] of COLUMNS) {
  const { rows } = await db.query<{ id: string; v: string }>(`select id, "${column}" as v from "${table}" where "${column}" is not null`);
  const plain = rows.filter((r) => !isSealed(r.v));
  console.log(`${label}: ${rows.length} tersimpan, ${plain.length} masih polos, ${rows.length - plain.length} sudah terenkripsi`);
  if (!apply) continue;
  let done = 0;
  for (const r of plain) {
    const sealed = sealSecret(r.v);
    if (openSecret(sealed) !== r.v) throw new Error(`Verifikasi gagal: ${table} ${r.id}, dihentikan.`);
    // CAS: hanya kalau nilainya masih nilai polos yang sama (tidak berubah di tengah jalan).
    const res = await db.query(`update "${table}" set "${column}" = $1 where id = $2 and "${column}" = $3`, [sealed, r.id, r.v]);
    done += res.rowCount ?? 0;
  }
  console.log(`  -> ${done} dienkripsi`);
}
if (!apply) console.log("Mode cek saja. Tambahkan --apply untuk mengenkripsi.");
await db.end();
