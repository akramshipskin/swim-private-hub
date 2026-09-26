"use server";

import { requireRole } from "@/lib/require-role";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formNumber, identityTakenWhere, normalizeEmail, normalizePhone, toProperCase } from "@/lib/format";
import { AdjustmentError, createWalletAdjustment } from "@/lib/wallet-adjustment";
import { createSelfDependent, createDependent } from "@/lib/dependents";
import { cancelBooking, CancelError } from "@/lib/cancel-booking";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import * as XLSX from "xlsx";

export type ActionState = { error?: string; success?: string } | null;

export async function createUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireRole("ADMIN");

  const rawName = formData.get("name") as string;
  const phone = normalizePhone((formData.get("phone") as string | null) ?? "");
  const email = normalizeEmail(formData.get("email") as string | null);
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "COACH" | "MEMBER" | "POOL_OWNER";

  if (!rawName || !phone || !password || !role) {
    return { error: "Nama, No HP, password, dan role wajib diisi" };
  }
  const name = toProperCase(rawName.trim());
  if (password.length < 8) {
    return { error: "Password minimal 8 karakter" };
  }

  // Samain kayak halaman daftar member sendiri -- kalau bikin akun Member,
  // wajib pilih minimal 1 peserta (diri sendiri/anak) dari sini juga.
  const types = formData.getAll("participantType").map(String);
  const names = formData.getAll("participantName").map(String);
  const childNames = types
    .map((t, i) => (t === "child" ? names[i]?.trim() : null))
    .filter((n): n is string => !!n)
    .map((n) => toProperCase(n));
  const wantsSelf = types.includes("self");

  if (role === "MEMBER" && childNames.length === 0 && !wantsSelf) {
    return { error: "Pilih minimal 1 peserta (diri sendiri atau anak)" };
  }

  const poolMode = formData.get("poolMode")?.toString();
  const poolId = formData.get("poolId")?.toString() ?? "";
  const newPoolName = formData.get("newPoolName")?.toString().trim() ?? "";
  const newPoolAddress = formData.get("newPoolAddress")?.toString().trim() ?? "";
  if (role === "POOL_OWNER") {
    if (poolMode === "new" ? !newPoolName : !poolId) {
      return { error: "Pilih kolam yang ada atau isi nama kolam baru" };
    }
    if (poolMode !== "new" && (await prisma.pool.count({ where: { id: poolId } })) === 0) {
      return { error: "Kolam tidak ditemukan" };
    }
  }

  const existing = await prisma.user.findFirst({ where: identityTakenWhere(phone, email) });
  if (existing) {
    return { error: "No HP atau email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          role,
          // Dibuat admin = sudah disetujui (tidak masuk daftar "menunggu").
          approvedAt: new Date(),
          // MEMBER wajib ganti password pas login pertama -- samain kayak
          // jalur import xlsx.
          ...(role === "MEMBER" ? { mustChangePassword: true } : {}),
          ...(role === "COACH" ? { coachProfile: { create: {} } } : {}),
        },
      });
      if (childNames.length > 0) {
        await tx.dependent.createMany({
          data: childNames.map((childName) => ({ memberId: created.id, name: childName })),
        });
      }
      if (wantsSelf) {
        await createSelfDependent(created.id, tx);
      }
      if (role === "POOL_OWNER") {
        const pool =
          poolMode === "new"
            ? await tx.pool.create({ data: { name: newPoolName, address: newPoolAddress || null, isActive: true } })
            : { id: poolId };
        await tx.poolOwnership.create({ data: { poolId: pool.id, ownerId: created.id } });
      }
    });
  } catch (err) {
    // Double-submit barengan: 2 request lolos cek `existing` di atas, yang
    // kalah kena unique constraint -- dulu jadi halaman error.
    if ((err as { code?: string })?.code === "P2002") {
      return { error: "No HP atau email sudah terdaftar" };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  // Bukan null: null = keadaan awal form, jadi dulu sukses tidak terlihat
  // (form tetap terisi, admin mengira gagal lalu kirim ulang -> "sudah terdaftar").
  return { success: `Akun ${name} dibuat.${role === "MEMBER" ? " Wajib ganti password saat login pertama." : ""}` };
}

const IMPORT_DEFAULT_JATAH_CANCEL = 2;
// Batas import (sweep keamanan 25 Sep): tiap member baru butuh hash password
// (±70 md), jadi 500 baris ≈ <1 menit -- masih di bawah batas waktu server.
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ROWS = 500;
const IMPORT_DEFAULT_DURATION_DAYS = 60;

// credentials: password sementara tiap member baru, HANYA dikembalikan sekali
// ke layar admin (untuk dikirim lewat WA), tidak disimpan di mana pun.
export type ImportCredential = { name: string; phone: string; password: string };
export type ImportState = { error?: string; result?: string; credentials?: ImportCredential[] } | null;

type ImportRow = {
  name: string | null;
  phone: string | null;
  email: string | null;
  pesertaName: string | null;
  paketName: string | null;
  sisaSesi: string | null;
};

// Header fleksibel: "Nama Member"/"nama"/"NAMA", "No HP"/"HP"/"Nomor HP", dst.
function pick(row: Record<string, unknown>, candidates: string[]) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const key = keys.find((k) => k.trim().toLowerCase() === c);
    if (key && row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return null;
}

export async function importMembersXlsx(
  _prevState: ImportState,
  formData: FormData
): Promise<ImportState> {
  await requireRole("ADMIN");

  // 1 file import = 1 kolam -- semua paket yang dibuat dari batch ini
  // pin ke kolam yang sama (locked /plan-eng-review 2026-09-12). Import
  // xlsx lintas-kolam sekaligus gak didukung -- jalanin importnya
  // per-kolam kalau ada beberapa.
  const poolId = formData.get("poolId") as string;
  if (!poolId) {
    return { error: "Pilih kolam tujuan import dulu" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Pilih file xlsx dulu" };
  }

  if (file.size > MAX_IMPORT_BYTES) {
    return { error: "File terlalu besar (maksimal 2MB). Pecah jadi beberapa file." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawRows: Record<string, unknown>[];
  try {
    // sheetRows: parser berhenti membaca setelah baris ke-(batas + judul + 1).
    const workbook = XLSX.read(buffer, { type: "buffer", sheetRows: MAX_IMPORT_ROWS + 2 });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    rawRows = XLSX.utils.sheet_to_json(firstSheet);
  } catch {
    return { error: "Gagal baca file. Pastikan format xlsx valid." };
  }

  if (rawRows.length === 0) {
    return { error: "File kosong atau tidak ada data di sheet pertama." };
  }
  if (rawRows.length > MAX_IMPORT_ROWS) {
    return { error: `Maksimal ${MAX_IMPORT_ROWS} baris per file. Pecah jadi beberapa file.` };
  }

  const rows: ImportRow[] = rawRows.map((row) => ({
    name: pick(row, ["nama member", "nama", "name"]),
    phone: pick(row, ["no hp", "nomor hp", "hp", "phone", "no. hp", "no telepon"]),
    email: pick(row, ["email (opsional)", "email"]),
    pesertaName: pick(row, ["nama peserta/anak", "nama peserta", "peserta", "anak", "nama anak"]),
    paketName: pick(row, ["paket aktif", "paket", "nama paket"]),
    sisaSesi: pick(row, ["sisa sesi", "sesi", "sisa sesi aktif"]),
  }));

  // Grup per No HP -- 1 member bisa punya beberapa baris (1 baris = 1
  // peserta). Baris pertama tiap grup yang nentuin nama/email member.
  const groups = new Map<string, ImportRow[]>();
  const skipped: string[] = [];

  for (const row of rows) {
    if (!row.phone) {
      skipped.push(row.name ? `${row.name} — No HP kosong` : "Baris tanpa No HP dilewati");
      continue;
    }
    const phone = normalizePhone(row.phone.replace(/[^\d+\s\-]/g, ""));
    const existingGroup = groups.get(phone);
    if (existingGroup) {
      existingGroup.push(row);
    } else {
      groups.set(phone, [row]);
    }
  }

  const templates = await prisma.packageTemplate.findMany({ where: { poolId } });
  const credentials: ImportCredential[] = [];

  let membersCreated = 0;
  let pesertaCreated = 0;
  let paketCreated = 0;

  for (const [phone, groupRows] of groups) {
    const first = groupRows[0];
    const rawName = first.name;
    if (!rawName) {
      skipped.push(`${phone} — baris pertama tidak ada Nama Member`);
      continue;
    }
    const name = toProperCase(rawName);
    const email = normalizeEmail(groupRows.find((r) => r.email)?.email);

    const existing = await prisma.user.findFirst({ where: identityTakenWhere(phone, email) });
    if (existing) {
      skipped.push(`${name} (${phone}) — HP atau email sudah terdaftar`);
      continue;
    }

    // Coba per grup, jangan biarin 1 grup gagal (misal error DB gak
    // terduga) nge-crash seluruh action -- grup lain yang udah keproses
    // sebelumnya harus tetep kehitung di ringkasan hasil, bukan ilang
    // gara-gara 1 baris rusak di tengah file besar. Counter lokal biar
    // gak nambahin ke total kalau transaksinya sendiri di-rollback.
    let groupMembersCreated = 0;
    let groupPesertaCreated = 0;
    let groupPaketCreated = 0;
    const groupSkipped: string[] = [];
    // Password acak per member (dulu satu password sama untuk semua import --
    // siapa pun yang tahu No HP member baru bisa masuk ke akunnya). Cost 10,
    // bukan 12: password ini wajib diganti saat login pertama, dan import
    // ratusan baris harus selesai sebelum batas waktu server.
    const tempPassword = newTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    try {
      await prisma.$transaction(async (tx) => {
        const member = await tx.user.create({
          data: {
            name,
            phone,
            email,
            passwordHash,
            role: "MEMBER",
            mustChangePassword: true,
          },
        });
        groupMembersCreated++;

        for (const row of groupRows) {
          // Baris tanpa peserta DAN tanpa paket = member polos, belum ada
          // peserta terdaftar -- biarin dia isi sendiri pas login pertama.
          if (!row.pesertaName && !row.paketName) continue;

          const dependent = row.pesertaName
            ? await createDependent(member.id, row.pesertaName, tx)
            : await createSelfDependent(member.id, tx);
          groupPesertaCreated++;

          if (!row.paketName) continue;

          const sisaSesiNum = row.sisaSesi ? Number(row.sisaSesi) : NaN;
          if (!Number.isInteger(sisaSesiNum) || sisaSesiNum < 0) {
            groupSkipped.push(`${name} — peserta "${dependent.name}": Sisa Sesi tidak valid, paket dilewati`);
            continue;
          }

          const paketName = toProperCase(row.paketName);
          const template = templates.find((t) => t.name.trim().toLowerCase() === paketName.toLowerCase());
          const totalSesi = template?.totalSesi ?? sisaSesiNum;
          const jatahCancel = template?.jatahCancel ?? IMPORT_DEFAULT_JATAH_CANCEL;
          const durationDays = template?.durationDays ?? IMPORT_DEFAULT_DURATION_DAYS;
          const sisaSesi = Math.min(sisaSesiNum, totalSesi);

          await tx.package.create({
            data: {
              memberId: member.id,
              dependentId: dependent.id,
              poolId,
              templateId: template?.id ?? null,
              name: paketName,
              totalSesi,
              sisaSesi,
              jatahCancel,
              status: "ACTIVE",
              startDate: new Date(),
              expiredDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
            },
          });
          groupPaketCreated++;
        }
      });

      membersCreated += groupMembersCreated;
      credentials.push({ name, phone, password: tempPassword });
      pesertaCreated += groupPesertaCreated;
      paketCreated += groupPaketCreated;
      skipped.push(...groupSkipped);
    } catch (err) {
      // Jangan tempel err.message mentah -- isinya pesan internal Prisma
      // lengkap sama path file server (kebukti di tes race lokal).
      const reason =
        (err as { code?: string })?.code === "P2002"
          ? "No HP/email sudah terpakai akun lain"
          : "error tidak terduga, coba import ulang baris ini";
      skipped.push(`${name} (${phone}) — gagal diimport: ${reason}`);
    }
  }

  revalidatePath("/admin/users");

  const parts = [
    `${membersCreated} member, ${pesertaCreated} peserta, ${paketCreated} paket berhasil diimport.`,
  ];
  if (skipped.length > 0) {
    parts.push(`${skipped.length} dilewati: ${skipped.slice(0, 5).join("; ")}${skipped.length > 5 ? "..." : ""}`);
  }
  if (membersCreated > 0) {
    parts.push("Password sementara tiap member ada di tabel di bawah — kirim ke masing-masing, wajib ganti saat pertama masuk.");
  }

  return { result: parts.join(" "), credentials };
}

export async function toggleUserActive(userId: string, nextActive: boolean) {
  const session = await requireRole("ADMIN");
  // Guard server-side juga (tombolnya udah disembunyiin buat diri sendiri).
  if (userId === session.user.id && !nextActive) return;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: nextActive },
    select: { role: true },
  });
  // Aktifkan pertama kali = persetujuan pendaftaran (penanda "menunggu
  // persetujuan" di dashboard hilang). Tidak menimpa tanggal lama.
  if (nextActive) {
    await prisma.user.updateMany({ where: { id: userId, approvedAt: null }, data: { approvedAt: new Date() } });
  }

  // Coach dinonaktifkan: booking yang BELUM dimulai dibatalkan otomatis
  // sebagai pembatalan admin (keputusan Hadi D2) -- sesi member kembali dan
  // member dapat notifikasi. Sesi yang sudah lewat tidak disentuh (urusan
  // absensi). Aman dari booking yang menyelip: booking mengunci baris coach
  // (FOR SHARE) dan update di atas menunggunya, jadi daftar di bawah sudah
  // mencakup booking itu; booking setelahnya ditolak karena coach nonaktif.
  if (!nextActive && user.role === "COACH") {
    const upcoming = await prisma.booking.findMany({
      where: { status: "BOOKED", attended: null, availability: { coachId: userId, startTime: { gt: new Date() } } },
      select: { id: true },
    });
    for (const b of upcoming) {
      try {
        await cancelBooking({ bookingId: b.id, actor: { role: "ADMIN" } });
      } catch (err) {
        // Sudah dibatalkan/ditandai di tempat lain di antaranya -- lewati.
        if (!(err instanceof CancelError)) throw err;
      }
    }
    revalidatePath("/admin/booking-overview");
  }

  revalidatePath("/admin/users");
}

// Alfabet tanpa karakter yang gampang ketuker pas dibaca/diketik ulang
// dari chat WA (0/O, 1/l/I).
const TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function newTempPassword() {
  return Array.from({ length: 10 }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]).join("");
}

// Admin reset password user yang lupa -- gak ada "lupa password" mandiri.
// Password sementara acak dibalikin ke admin (buat dikirim lewat WA), dan
// mustChangePassword dipaksa true: user wajib bikin password baru pas login
// (session yang lagi kebuka juga ikut kepaksa, lihat jwt callback di auth.ts).
export async function resetUserPassword(
  userId: string
): Promise<{ tempPassword?: string; error?: string }> {
  const session = await requireRole("ADMIN");
  if (userId === session.user.id) {
    return { error: "Ganti password akunmu sendiri lewat halaman Profil." };
  }

  const tempPassword = newTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const updated = await prisma.user.updateMany({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true, sessionVersion: { increment: 1 } },
  });
  if (updated.count === 0) {
    return { error: "User tidak ditemukan." };
  }
  return { tempPassword };
}

// Reset 2FA coach/member/pemilik kolam yang kehilangan HP. Setelah ini mereka
// masuk pakai password saja (bisa pasang 2FA lagi dari Profil). Semua sesi
// yang terbuka ikut keluar. Akun admin TIDAK lewat sini (2FA admin wajib;
// reset lewat scripts/reset-admin-2fa.mts).
export async function resetUserTotp(userId: string): Promise<{ error?: string }> {
  await requireRole("ADMIN");
  const res = await prisma.user.updateMany({
    where: { id: userId, role: { not: "ADMIN" } },
    data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, sessionVersion: { increment: 1 } },
  });
  if (res.count === 0) return { error: "User tidak ditemukan, atau akun admin (reset admin lewat skrip server)." };
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

// id = kunci kiriman: berubah tiap koreksi berhasil, dipakai formulir untuk
// mengosongkan isiannya.
export type WalletAdjustState = { error?: string; ok?: boolean; id?: string } | null;

// Koreksi saldo coach/kolam (lihat src/lib/wallet-adjustment.ts). Arah dipilih
// terpisah dari nominal supaya admin tidak perlu mengetik tanda minus.
export async function adjustWallet(_state: WalletAdjustState, formData: FormData): Promise<WalletAdjustState> {
  const session = await requireRole("ADMIN");
  const targetType = formData.get("targetType");
  const targetId = String(formData.get("targetId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const direction = formData.get("direction");
  const source = formData.get("source");
  const nominal = formNumber(formData, "amount");

  if ((targetType !== "pool" && targetType !== "coach") || !targetId) return { error: "Formulir tidak lengkap, muat ulang halaman." };
  if (direction !== "credit" && direction !== "debit") return { error: "Pilih tambah atau kurangi saldo." };
  if (source !== "platform" && source !== "none") return { error: "Pilih sumber dana koreksi." };
  if (!Number.isInteger(nominal) || nominal <= 0) return { error: "Isi nominal koreksi." };

  const idempotencyKey = String(formData.get("idempotencyKey") ?? "");
  try {
    await createWalletAdjustment({
      target: targetType === "pool" ? { poolId: targetId } : { coachProfileId: targetId },
      amount: direction === "credit" ? nominal : -nominal,
      reason: String(formData.get("reason") ?? ""),
      fromPlatform: source === "platform",
      adminId: session.user.id,
      idempotencyKey,
    });
  } catch (err) {
    if (err instanceof AdjustmentError) return { error: err.message };
    throw err;
  }
  if (userId) revalidatePath(`/admin/users/${userId}`);
  revalidatePath(targetType === "pool" ? "/pool/saldo" : "/coach/saldo");
  revalidatePath("/admin/komisi");
  revalidatePath("/admin/kolam");
  revalidatePath("/admin");
  return { ok: true, id: idempotencyKey };
}
