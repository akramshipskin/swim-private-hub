// Akhiri paket model lama (Hadi 2 Okt malam, #9: model bagi hasil persen dihapus,
// semua data masih dummy). Paket lama = tanpa harga kolam/coach tersalin
// ("poolPrice" kosong). Yang masih Aktif / Menunggu bayar ditandai Berakhir
// (EXPIRED); booking mendatangnya dibatalkan oleh admin dan slotnya dibuka lagi.
// Riwayat (paket, pembayaran, booking lampau, buku besar, saldo) TIDAK diubah.
//
// Default = hanya menampilkan rencana. Tambah --apply untuk menjalankan.
// Aman diulang (yang sudah berakhir dilewati).
//   lokal:      node --env-file=.env scripts/akhiri-paket-lama.mjs [--apply]
//   production: set -a; source .env.prod; set +a; DATABASE_URL=$PROD_DIRECT_URL AKHIRI_PAKET_LAMA_PROD=1 node scripts/akhiri-paket-lama.mjs [--apply]
import pg from "pg";

const apply = process.argv.includes("--apply");
const url = process.env.DATABASE_URL ?? "";
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && process.env.AKHIRI_PAKET_LAMA_PROD !== "1") {
  console.error("Ditolak: database bukan lokal (production: set AKHIRI_PAKET_LAMA_PROD=1).");
  process.exit(1);
}
const db = new pg.Client({ connectionString: url.replace(/\?.*$/, ""), ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
await db.query("BEGIN");

const pkgs = await db.query(`
  SELECT p.id, p.name, p.status, p."sisaSesi", u.name AS member, pl.name AS pool
  FROM "Package" p JOIN "User" u ON u.id = p."memberId" JOIN "Pool" pl ON pl.id = p."poolId"
  WHERE p."poolPrice" IS NULL AND p.status IN ('ACTIVE', 'PENDING_PAYMENT')
  ORDER BY pl.name, u.name
  FOR UPDATE OF p`);
const ids = pkgs.rows.map((r) => r.id);
const upcoming = ids.length
  ? await db.query(
      `SELECT b.id, b."availabilityId", a."startTime" FROM "Booking" b JOIN "Availability" a ON a.id = b."availabilityId"
       WHERE b."packageId" = ANY($1) AND b.status = 'BOOKED' AND b.attended IS NULL AND a."startTime" > now()
       FOR UPDATE OF b, a`,
      [ids],
    )
  : { rows: [] };
// Booking lampau yang belum ditandai: dibiarkan (riwayat). Tandai hadir paket
// berbayar model lama ditolak aplikasi; admin mengoreksi lewat Koreksi Saldo.
const pastUnmarked = ids.length
  ? await db.query(
      `SELECT count(*)::int AS n FROM "Booking" b JOIN "Availability" a ON a.id = b."availabilityId"
       WHERE b."packageId" = ANY($1) AND b.status = 'BOOKED' AND b.attended IS NULL AND a."startTime" <= now()`,
      [ids],
    )
  : { rows: [{ n: 0 }] };

console.log(`Paket model lama yang masih aktif/menunggu bayar: ${pkgs.rowCount}`);
for (const r of pkgs.rows) console.log(`  - ${r.pool} · ${r.member} · ${r.name} · ${r.status} · sisa ${r.sisaSesi}`);
console.log(`Booking mendatang yang dibatalkan (slot dibuka lagi): ${upcoming.rows.length}`);
console.log(`Booking lampau belum ditandai (dibiarkan): ${pastUnmarked.rows[0].n}`);

if (apply && ids.length) {
  const bookingIds = upcoming.rows.map((r) => r.id);
  if (bookingIds.length) {
    await db.query(`UPDATE "Booking" SET status = 'CANCELLED', "cancelledBy" = 'ADMIN', "cancelledAt" = now() WHERE id = ANY($1)`, [bookingIds]);
    await db.query(`UPDATE "Availability" SET status = 'AVAILABLE' WHERE id = ANY($1) AND status = 'BOOKED'`, [upcoming.rows.map((r) => r.availabilityId)]);
  }
  await db.query(`UPDATE "Package" SET status = 'EXPIRED' WHERE id = ANY($1)`, [ids]);
  // Pembayaran yang masih menunggu ikut ditandai kedaluwarsa. Kalau Midtrans tetap
  // mengabarkan lunas (uang sungguhan masuk), notifikasi itu tetap dihormati dan
  // paket aktif lagi; paket lama tidak bisa dibooking, jadi admin memberi paket
  // model baru sebagai gantinya.
  const pays = await db.query(`UPDATE "Payment" SET status = 'EXPIRED' WHERE "packageId" = ANY($1) AND status = 'PENDING'`, [ids]);
  console.log(`Pembayaran menunggu ditandai kedaluwarsa: ${pays.rowCount}`);
  await db.query("COMMIT");
  console.log("Selesai: paket ditandai Berakhir.");
} else {
  await db.query("ROLLBACK");
  console.log(apply ? "Tidak ada yang perlu diubah." : "Belum ada yang diubah. Jalankan lagi dengan --apply.");
}
await db.end();
