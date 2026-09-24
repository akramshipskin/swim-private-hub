/**
 * Audit data (HANYA BACA -- tidak mengubah apa pun) setelah pembakuan HP/email,
 * password import, dan constraint saldo (24 Sep 2026). Keluaran sengaja
 * disamarkan (HP 4 digit terakhir, email huruf pertama + domain, nama depan)
 * supaya aman ditempel ke chat.
 *
 * Jalankan (produksi):
 *   set -a; source .env.prod; set +a; DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/audit-prod-data.mts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizePhone, normalizeEmail } from "../src/lib/format";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const maskPhone = (p: string) => (p.length > 4 ? `${p.slice(0, 2)}${"•".repeat(Math.max(p.length - 6, 1))}${p.slice(-4)}` : "••••");
const maskEmail = (e: string) => {
  const [u, d] = e.split("@");
  return `${u?.[0] ?? "?"}•••@${d ?? "?"}`;
};
const firstName = (n: string | null) => (n ?? "?").trim().split(/\s+/)[0];
const show = (title: string, lines: string[], max = 15) => {
  console.log(`\n=== ${title}`);
  if (lines.length === 0) console.log("  (tidak ada)");
  for (const l of lines.slice(0, max)) console.log("  " + l);
  if (lines.length > max) console.log(`  ... dan ${lines.length - max} lagi`);
};

const users = await prisma.user.findMany({
  select: { id: true, name: true, role: true, phone: true, email: true, isActive: true, mustChangePassword: true, passwordHash: true, anonymizedAt: true },
});
const live = users.filter((u) => !u.anonymizedAt);
console.log(`Total akun: ${users.length} (aktif dipakai: ${live.filter((u) => u.isActive).length}, sudah dianonimkan: ${users.length - live.length})`);

// 1. HP ---------------------------------------------------------------
const phones = live.filter((u) => u.phone);
const phoneOldFormat = phones.filter((u) => normalizePhone(u.phone!) !== u.phone);
const phoneStillBad = phones.filter((u) => !/^08\d{8,12}$/.test(normalizePhone(u.phone!)));
show(`HP: bentuk lama yang harus dibakukan ke 08xxxxxxxxxx (${phoneOldFormat.length} dari ${phones.length})`, phoneOldFormat.map((u) => `${firstName(u.name)} (${u.role}) ${maskPhone(u.phone!)} -> ${maskPhone(normalizePhone(u.phone!))}`));
show(`HP: tetap tidak valid setelah dibakukan (${phoneStillBad.length})`, phoneStillBad.map((u) => `${firstName(u.name)} (${u.role}) ${maskPhone(u.phone!)}`));
const byCanon = new Map<string, typeof phones>();
for (const u of phones) byCanon.set(normalizePhone(u.phone!), [...(byCanon.get(normalizePhone(u.phone!)) ?? []), u]);
show("HP: nomor sama setelah dibakukan (akan bentrok kalau dibakukan massal)", [...byCanon.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => `${maskPhone(k)}: ${v.map((u) => `${firstName(u.name)}(${u.role})`).join(", ")}`));

// 2. Email ------------------------------------------------------------
const emails = live.filter((u) => u.email);
show(`Email: masih ada huruf besar / spasi (${emails.filter((u) => normalizeEmail(u.email) !== u.email).length} dari ${emails.length})`, emails.filter((u) => normalizeEmail(u.email) !== u.email).map((u) => `${firstName(u.name)} (${u.role}) ${maskEmail(u.email!)}`));
const byEmail = new Map<string, typeof emails>();
for (const u of emails) byEmail.set(normalizeEmail(u.email)!, [...(byEmail.get(normalizeEmail(u.email)!) ?? []), u]);
show("Email: sama setelah huruf kecil (akan bentrok)", [...byEmail.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => `${maskEmail(k)}: ${v.map((u) => `${firstName(u.name)}(${u.role})`).join(", ")}`));

// 3. Password import lama ----------------------------------------------
const flagged = live.filter((u) => u.mustChangePassword);
const stillDefault: typeof flagged = [];
for (const u of flagged) if (await bcrypt.compare("renang2026", u.passwordHash)) stillDefault.push(u);
show(
  `Password: ${stillDefault.length} akun MASIH memakai password bawaan import 'renang2026' (dari ${flagged.length} yang wajib ganti password)`,
  stillDefault.map((u) => `${firstName(u.name)} (${u.role}, ${u.isActive ? "aktif" : "nonaktif"}) ${u.phone ? maskPhone(u.phone) : u.email ? maskEmail(u.email) : "-"}`),
  30,
);

// 4. Data yang melanggar 2 CHECK saldo (sebelum VALIDATE CONSTRAINT) ------
const [walletBad] = await prisma.$queryRaw<{ n: bigint }[]>`
  SELECT count(*) AS n FROM "WalletTransaction" WHERE NOT (
    ("type" = 'SESSION_REVENUE' AND "poolId" IS NOT NULL AND "coachProfileId" IS NULL)
    OR ("type" = 'SESSION_PAYOUT' AND "coachProfileId" IS NOT NULL AND "poolId" IS NULL)
    OR ("type" = 'WITHDRAWAL' AND (("poolId" IS NULL) <> ("coachProfileId" IS NULL)))
    OR ("type" IN ('PLATFORM_REVENUE', 'PLATFORM_TAX') AND "poolId" IS NULL AND "coachProfileId" IS NULL))`;
const [wdBad] = await prisma.$queryRaw<{ n: bigint }[]>`
  SELECT count(*) AS n FROM "WithdrawalRequest" WHERE NOT (("poolId" IS NULL) <> ("coachProfileId" IS NULL))`;
const cons = await prisma.$queryRaw<{ conname: string; convalidated: boolean }[]>`
  SELECT conname, convalidated FROM pg_constraint WHERE conname IN ('WalletTransaction_owner_matches_type', 'WithdrawalRequest_exactly_one_owner') ORDER BY conname`;
console.log("\n=== Constraint saldo");
console.log(`  baris WalletTransaction yang melanggar: ${walletBad.n}`);
console.log(`  baris WithdrawalRequest yang melanggar: ${wdBad.n}`);
for (const c of cons) console.log(`  ${c.conname}: ${c.convalidated ? "sudah divalidasi" : "belum divalidasi (NOT VALID)"}`);

await prisma.$disconnect();
console.log("\nSelesai. Skrip ini hanya membaca; tidak ada data yang diubah.");
