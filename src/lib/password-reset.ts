import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/format";
import { storedKey, takeAttempt } from "@/lib/rate-limit";
import { buildAdminWaLink } from "@/lib/whatsapp";
import { after } from "next/server";
import { INBOX_FROM_ADDRESS, sendPlainEmail } from "@/lib/email";

type Defer = (task: () => Promise<void>) => void;
// Email dikirim sesudah jawaban keluar (after), supaya lama jawaban tidak
// membedakan email terdaftar dan tidak. Tes memberi pengganti langsung.
const afterResponse: Defer = (task) => after(task);
const FROM = `Swim Private Hub <${INBOX_FROM_ADDRESS}>`;

// Reset password lewat email (P8, Hadi 11 Okt). Tanpa tabel token: tautan
// ditandatangani AUTH_SECRET dan terikat ke sessionVersion + sidik password
// saat ini, jadi otomatis mati begitu password berganti (sekali pakai) atau
// setelah RESET_TTL_MS. Admin tidak bisa reset lewat email (2FA + akses penuh;
// reset admin tetap lewat admin lain).

export const RESET_TTL_MS = 30 * 60_000;
export const RESET_REQUESTS_PER_EMAIL = 3;
export const RESET_REQUESTS_PER_IP = 10;
export const RESET_WINDOW_MS = 60 * 60_000;
export const RESET_SENT_MESSAGE =
  "Kalau email itu terdaftar, tautan untuk membuat password baru sudah kami kirim. Cek kotak masuk dan folder spam; tautan berlaku 30 menit.";
export const RESET_INVALID_ERROR = "Tautan ini sudah tidak berlaku. Minta tautan baru dari halaman Lupa Password.";

const BASE_URL = () => process.env.APP_BASE_URL ?? "https://www.swimprivatehub.biz.id";

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET belum dipasang.");
  return s;
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString();
const passwordPrint = (hash: string) => createHash("sha256").update(hash).digest("base64url").slice(0, 16);
const sign = (body: string, print: string) => createHmac("sha256", secret()).update(`${body}|${print}`).digest("base64url");

type ResetUser = { id: string; sessionVersion: number; passwordHash: string };

export function createResetToken(user: ResetUser, now = Date.now()): string {
  const body = b64(`${user.id}.${now + RESET_TTL_MS}.${user.sessionVersion}`);
  return `${body}.${sign(body, passwordPrint(user.passwordHash))}`;
}

const eligibleWhere = { isActive: true, anonymizedAt: null, rejectedAt: null, role: { not: "ADMIN" as const } };

// Kembalikan pemilik token bila tanda tangan cocok, belum kedaluwarsa, password
// dan sessionVersion belum berubah, dan akun masih boleh reset; selain itu null.
export async function verifyResetToken(token: string, now = Date.now()) {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const [id, expRaw, svRaw] = unb64(body).split(".");
  const exp = Number(expRaw);
  if (!id || !Number.isFinite(exp) || exp < now) return null;
  const user = await prisma.user.findFirst({
    where: { id, ...eligibleWhere },
    select: { id: true, sessionVersion: true, passwordHash: true, email: true, phone: true },
  });
  if (!user || String(user.sessionVersion) !== svRaw) return null;
  const expected = Buffer.from(sign(body, passwordPrint(user.passwordHash)));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return user;
}

// Selalu mengembalikan pesan yang sama (tidak membocorkan email mana yang
// terdaftar). Batas: 3 per email dan 10 per jaringan per jam.
export async function requestPasswordReset(rawEmail: string, ip: string, defer: Defer = afterResponse): Promise<{ error?: string; ok?: string }> {
  const email = normalizeEmail(rawEmail);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: "Tulis alamat email yang valid." };
  if (!(await takeAttempt(`reset-ip:${ip}`, RESET_REQUESTS_PER_IP, RESET_WINDOW_MS))) {
    return { error: "Terlalu banyak permintaan dari jaringan ini. Coba lagi dalam 1 jam." };
  }
  if (!(await takeAttempt(`reset-email:${email}`, RESET_REQUESTS_PER_EMAIL, RESET_WINDOW_MS))) return { ok: RESET_SENT_MESSAGE };
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, ...eligibleWhere },
    select: { id: true, name: true, email: true, sessionVersion: true, passwordHash: true },
  });
  if (user?.email) {
    const to = user.email;
    const link = `${BASE_URL()}/reset-password?token=${createResetToken(user)}`;
    // Gagal kirim tidak boleh membedakan jawaban (email terdaftar atau tidak).
    defer(() =>
      sendPlainEmail({
        from: FROM,
        to,
        subject: "Buat password baru Swim Private Hub",
        text: `Halo ${user.name},\n\nAda permintaan membuat password baru untuk akunmu. Buka tautan ini dalam 30 menit:\n\n${link}\n\nKalau kamu tidak memintanya, abaikan email ini; password lamamu tetap berlaku.\n\nSwim Private Hub`,
      }).catch((err) => console.error("[reset-password] kirim email gagal", err)),
    );
  }
  return { ok: RESET_SENT_MESSAGE };
}

// Ganti password memakai token. Atomik: hanya berhasil bila sessionVersion
// masih sama dengan yang ada di token (dua klik bersamaan = satu yang lolos).
export async function resetPasswordWithToken(token: string, newPassword: string, confirm: string, defer: Defer = afterResponse): Promise<{ error?: string }> {
  if (!newPassword || newPassword.length < 8) return { error: "Password baru minimal 8 karakter" };
  if (newPassword.length > 200) return { error: "Password maksimal 200 karakter" };
  if (newPassword !== confirm) return { error: "Konfirmasi password tidak sama" };
  const user = await verifyResetToken(token);
  if (!user) return { error: RESET_INVALID_ERROR };
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const done = await prisma.user.updateMany({
    where: { id: user.id, sessionVersion: user.sessionVersion, passwordHash: user.passwordHash },
    // mustChangePassword sengaja tidak diubah: akun yang masih wajib ganti
    // password sementara (buatan admin/impor) tetap melewati Ganti Password
    // dan pengisian peserta sesudah masuk.
    data: { passwordHash, sessionVersion: { increment: 1 } },
  });
  if (done.count === 0) return { error: RESET_INVALID_ERROR };
  // Kunci login karena salah password ikut dibuka untuk akun ini: per akun
  // (login:<id>) dan per akun per jaringan (login-net:<ip>:<id>), memakai
  // bentuk yang sama dengan halaman Masuk.
  const ids = [normalizeEmail(user.email), user.phone ? normalizePhone(user.phone) : null].filter((x): x is string => !!x);
  if (ids.length) {
    // Dicocokkan persis di sini (bukan endsWith Prisma: "_" dan "%" ikut jadi
    // pola LIKE dan bisa membuka kunci akun lain yang emailnya mirip).
    // ponytail: mengambil semua kunci login-net (tabel hanya menyimpan ±1 hari);
    // bila trafik besar, simpan id akun di kolom sendiri dan cari lewat indeks.
    const net = await prisma.rateLimitHit.findMany({ where: { key: { startsWith: "login-net:" } }, select: { id: true, key: true } });
    const own = new Set(ids.map((id) => storedKey(`login:${id}`)));
    const hitIds = net.filter((h) => ids.some((id) => h.key.endsWith(`:${id}`))).map((h) => h.id);
    await prisma.rateLimitHit.deleteMany({ where: { OR: [{ key: { in: [...own] } }, { id: { in: hitIds } }] } });
  }
  if (user.email) {
    const to = user.email;
    defer(() =>
      sendPlainEmail({
        from: FROM,
        to,
        subject: "Password Swim Private Hub kamu baru diganti",
        text: `Halo,\n\nPassword akun Swim Private Hub kamu baru saja diganti lewat tautan Lupa Password, dan semua perangkat yang masih masuk sudah dikeluarkan.\n\nKalau bukan kamu yang menggantinya, segera hubungi admin lewat WhatsApp: ${buildAdminWaLink("Halo Admin Swim Private Hub, password akun saya diganti tanpa sepengetahuan saya.")}\n\nSwim Private Hub`,
      }).catch((err) => console.error("[reset-password] kirim pemberitahuan gagal", err)),
    );
  }
  return {};
}
