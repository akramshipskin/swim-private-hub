// Isi harga contoh untuk kolam & coach DUMMY yang belum memasang harga (Hadi 2 Okt:
// "yang sekarang masih dummy, lu settingin harga aja dulu"). Hanya mengisi yang
// masih kosong; harga yang sudah diisi tidak disentuh. Kolam asli nanti memasang
// harganya sendiri.
//   lokal:      node --env-file=.env scripts/isi-harga-dummy.mjs
//   production: set -a; source .env.prod; set +a; DATABASE_URL=$PROD_DIRECT_URL HARGA_DUMMY_PROD=1 node scripts/isi-harga-dummy.mjs
import pg from "pg";

const url = process.env.DATABASE_URL ?? "";
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
if (!local && process.env.HARGA_DUMMY_PROD !== "1") {
  console.error("Ditolak: database bukan lokal (production: set HARGA_DUMMY_PROD=1).");
  process.exit(1);
}
const db = new pg.Client({ connectionString: url.replace(/\?.*$/, ""), ssl: local ? false : { rejectUnauthorized: false } });
await db.connect();
await db.query("BEGIN");
const pools = await db.query(`UPDATE "Pool" SET "pricePack4" = COALESCE("pricePack4", 260000), "pricePack8" = COALESCE("pricePack8", 480000)
  WHERE "pricePack4" IS NULL OR "pricePack8" IS NULL RETURNING name`);
const coaches = await db.query(`UPDATE "CoachProfile" SET "pricePack4" = COALESCE("pricePack4", 440000), "pricePack8" = COALESCE("pricePack8", 800000)
  WHERE "pricePack4" IS NULL OR "pricePack8" IS NULL RETURNING id`);
await db.query("COMMIT");
console.log(`Kolam diisi: ${pools.rowCount} (${pools.rows.map((r) => r.name).join(", ") || "-"})`);
console.log(`Coach diisi: ${coaches.rowCount}`);
console.log("Harga contoh: kolam Rp260.000 (4 sesi) / Rp480.000 (8 sesi), coach Rp440.000 / Rp800.000.");
await db.end();
