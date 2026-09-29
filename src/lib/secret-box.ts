import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Enkripsi kolom rahasia di database (AES-256-GCM). Kalau salinan/backup
// database bocor, isinya tidak bisa dipakai tanpa kunci di env server.
//
// Format tersimpan: "enc:v1:<iv>:<tag>:<ciphertext>" (base64url).
// Nilai TANPA awalan itu dianggap data lama yang belum dienkripsi dan
// dikembalikan apa adanya -- supaya kode baru bisa di-deploy sebelum data
// lama dienkripsi (scripts/encrypt-secrets.mts), tanpa login admin rusak.
//
// Kunci: SECRET_ENCRYPTION_KEY = 32 byte acak dalam base64
// (buat: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
// Kunci dev dan production HARUS beda. Kunci hilang = data terenkripsi
// tidak bisa dibuka lagi (untuk 2FA: pengguna pasang ulang 2FA).

const PREFIX = "enc:v1:";

function key(): Buffer {
  const raw = process.env.SECRET_ENCRYPTION_KEY;
  if (!raw) throw new Error("SECRET_ENCRYPTION_KEY belum diisi di environment server.");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("SECRET_ENCRYPTION_KEY harus 32 byte (base64).");
  return buf;
}

export function isSealed(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function sealSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return PREFIX + [iv, cipher.getAuthTag(), ct].map((b) => b.toString("base64url")).join(":");
}

export function openSecret(stored: string): string {
  if (!isSealed(stored)) return stored;
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(":").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
