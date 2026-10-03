// Isi jam kosong contoh untuk coach DUMMY (email berakhiran @example.com) supaya
// lolos syarat tampil "minimal 4 jam kosong dalam 14 hari" (Hadi 3 Okt, 3A).
// Per pasangan coach-kolam yang aktif dan punya jam buka: hanya MENAMBAH sampai
// total 4 jam kosong (AVAILABLE) dalam 14 hari ke depan; yang sudah cukup tidak
// disentuh. Jam di dalam jam buka kolam, tanggal hari ke-3 sampai ke-13, jam
// berbeda per kolam supaya tidak bentrok antar kolam. Aman diulang. Hanya coach
// @example.com DAN kolam contoh (5 nama tetap di src/lib/landing-rank.ts); akun
// atau kolam asli tidak disentuh. Baca daftar di hasil uji coba sebelum --apply.
// Default = hanya menampilkan rencana. Tambah --apply untuk menjalankan.
//   lokal:      node --env-file=.env scripts/isi-jadwal-dummy.mjs [--apply]
//   production: set -a; source .env.prod; set +a; DATABASE_URL=$PROD_DIRECT_URL JADWAL_DUMMY_PROD=1 node scripts/isi-jadwal-dummy.mjs [--apply]
import crypto from "node:crypto";
import pg from "pg";

const apply = process.argv.includes("--apply");
const url = process.env.DATABASE_URL ?? "";
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && process.env.JADWAL_DUMMY_PROD !== "1") {
  console.error("Ditolak: database bukan lokal (production: set JADWAL_DUMMY_PROD=1).");
  process.exit(1);
}
const NEED = 4;
const db = new pg.Client({ connectionString: url.replace(/\?.*$/, ""), ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
await db.query("BEGIN");
await db.query("SET LOCAL TIME ZONE 'UTC'");
// Sama dengan DEMO_POOL_NAMES di src/lib/landing-rank.ts.
const DEMO_POOLS = ["Kolam Renang Melati", "Kolam Renang Tirta Asri", "Kolam Renang Bahari", "Kolam Renang Cempaka", "Kolam Renang Samudra"];

const ymdWib = (offsetDays) => new Date(Date.now() + 7 * 3_600_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
const pairs = (
  await db.query(`
    SELECT u.id AS coach_id, u.name AS coach, p.id AS pool_id, p.name AS pool, p."openTime", p."closeTime",
           row_number() OVER (PARTITION BY u.id ORDER BY p.name) - 1 AS idx
    FROM "PoolAffiliation" a
    JOIN "User" u ON u.id = a."coachId" AND u.role = 'COACH' AND u."isActive" AND lower(u.email) LIKE '%@example.com'
    JOIN "CoachProfile" cp ON cp."userId" = u.id AND cp."isActive"
    JOIN "Pool" p ON p.id = a."poolId" AND p."isActive" AND p."openTime" IS NOT NULL AND p."closeTime" IS NOT NULL AND p.name = ANY($1)
    ORDER BY u.name, p.name`,
    [DEMO_POOLS],
  )
).rows;

let added = 0;
for (const pr of pairs) {
  // Hanya jam yang benar-benar bisa dibooking (di dalam jam buka kolam, WIB) yang dihitung.
  const hhmm = (t) => new Date(t.getTime() + 7 * 3_600_000).toISOString().slice(11, 16);
  const have = (
    await db.query(
      `SELECT "startTime", "endTime" FROM "Availability"
       WHERE "coachId" = $1 AND "poolId" = $2 AND status = 'AVAILABLE' AND "startTime" > now() AND "startTime" <= now() + interval '14 days'`,
      [pr.coach_id, pr.pool_id],
    )
  ).rows.filter((r) => hhmm(r.startTime) >= pr.openTime && hhmm(r.endTime) <= pr.closeTime).length;
  let need = NEED - have;
  if (need <= 0) continue;
  // Jam mulai 09:00 + nomor kolam coach itu, harus muat di jam buka kolam.
  const hour = 9 + Number(pr.idx);
  const hh = String(hour).padStart(2, "0");
  if (`${hh}:00` < pr.openTime || `${String(hour + 1).padStart(2, "0")}:00` > pr.closeTime) {
    console.log(`  - ${pr.coach} · ${pr.pool}: jam ${hh}:00 di luar jam buka ${pr.openTime}-${pr.closeTime}, dilewati`);
    continue;
  }
  let made = 0;
  for (let d = 3; d <= 13 && need > 0; d++) {
    const day = ymdWib(d);
    const start = new Date(`${day}T${hh}:00:00+07:00`);
    const end = new Date(start.getTime() + 3_600_000);
    if (!apply) {
      made++;
      need--;
      continue;
    }
    const r = await db.query(
      `INSERT INTO "Availability" (id, "coachId", "poolId", date, "startTime", "endTime")
       VALUES ($1, $2, $3, $4::date, $5::timestamptz, $6::timestamptz)
       ON CONFLICT ("coachId", date, "startTime") DO NOTHING`,
      [crypto.randomUUID().replace(/-/g, ""), pr.coach_id, pr.pool_id, day, start.toISOString(), end.toISOString()],
    );
    if (r.rowCount === 1) {
      made++;
      need--;
    }
  }
  added += made;
  console.log(`  - ${pr.coach} · ${pr.pool}: punya ${have}, ${apply ? "ditambah" : "akan ditambah"} ${made} jam (${hh}:00 WIB)`);
}
console.log(`Pasangan coach-kolam contoh dicek: ${pairs.length}; jam kosong ${apply ? "ditambah" : "yang akan ditambah"}: ${added}`);
if (apply) {
  await db.query("COMMIT");
  console.log("Selesai.");
} else {
  await db.query("ROLLBACK");
  console.log("Belum ada yang diubah. Jalankan lagi dengan --apply.");
}
await db.end();
