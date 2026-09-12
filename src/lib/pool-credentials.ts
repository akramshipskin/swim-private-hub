import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.MIDTRANS_CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "MIDTRANS_CREDENTIAL_ENCRYPTION_KEY belum di-set di .env -- wajib ada buat nyimpen/baca kredensial Midtrans per-kolam. Generate dengan `openssl rand -base64 32`."
    );
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "MIDTRANS_CREDENTIAL_ENCRYPTION_KEY harus 32 byte (base64-encoded) -- generate dengan `openssl rand -base64 32`."
    );
  }
  return buf;
}

// Kredensial Midtrans tiap kolam (server key + client key MEREKA
// SENDIRI, bukan platform -- lihat Pool di prisma/schema.prisma) gak
// boleh kesimpen plaintext di DB. Format tersimpan:
// base64(iv):base64(authTag):base64(ciphertext) -- AES-256-GCM, auth
// tag bikin ciphertext yang diutak-atik ketauan (decrypt gagal, gak
// diem-diem ngasih hasil salah).
export function encryptPoolCredential(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptPoolCredential(stored: string): string {
  const key = getEncryptionKey();
  const parts = stored.split(":");
  if (parts.length !== 3) {
    throw new Error("Format kredensial Midtrans kolam ini rusak/tidak valid.");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
