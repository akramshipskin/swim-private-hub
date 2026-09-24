import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// TOTP (RFC 6238, dipakai Google Authenticator): 6 digit, SHA-1, 30 detik.
// Ditulis sendiri (±40 baris) supaya tidak menambah dependency.

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

export function base32Encode(buf: Buffer): string {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of clean) {
    value = (value << 5) | B32.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function newTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpAt(secret: string, step: number, digits = 6): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = h[h.length - 1] & 15;
  const bin = ((h[offset] & 127) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export function currentStep(now = Date.now()): number {
  return Math.floor(now / 1000 / STEP_SECONDS);
}

// Kode cocok dengan langkah sekarang ±1 (toleransi jam HP meleset ~30 detik)?
// Mengembalikan langkah yang cocok, atau null. Pemanggil WAJIB menolak langkah
// <= totpLastStep (kode yang sama tidak boleh dipakai dua kali).
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return null;
  const step = currentStep(now);
  for (const s of [step - 1, step, step + 1]) {
    const expected = totpAt(secret, s);
    if (timingSafeEqual(Buffer.from(expected), Buffer.from(c))) return s;
  }
  return null;
}

// Link yang dibuka aplikasi authenticator di HP (tap dari HP langsung
// menambahkan akun). Juga bisa diketik manual lewat "Masukkan kunci".
export function otpauthUrl(secret: string, account: string): string {
  const issuer = "Swim Private Hub";
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// 2FA wajib hanya untuk admin (keputusan Hadi 25 Sep); coach, member, dan
// pemilik kolam boleh memasang tapi tidak dipaksa.
export function needsTotpSetup(role: string, totpEnabledAt: Date | null): boolean {
  return role === "ADMIN" && !totpEnabledAt;
}
