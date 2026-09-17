// Isi database dev lokal dengan salinan data production (READ-ONLY ke prod).
// Butuh: `npm run db:dev` sedang jalan, dan .env.prod berisi PROD_DIRECT_URL.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

// Tanggal/waktu disalin apa adanya (string), supaya tidak bergeser zona waktu.
for (const oid of [1082, 1114, 1184]) pg.types.setTypeParser(oid, (v) => v);

const ROOT = path.resolve(import.meta.dirname, "..");
const LOCAL = "postgresql://dev:dev@localhost:54330/swim_dev";

const prodEnv = Object.fromEntries(
  readFileSync(path.join(ROOT, ".env.prod"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "")]),
);
const PROD = prodEnv.PROD_DIRECT_URL;
if (!PROD) throw new Error(".env.prod tidak berisi PROD_DIRECT_URL");

// Skema lokal = skema dari migrasi di repo.
execSync("npx prisma migrate deploy", {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: LOCAL, DIRECT_URL: LOCAL },
});

const src = new pg.Client({ connectionString: PROD });
const dst = new pg.Client({ connectionString: LOCAL });
await src.connect();
await dst.connect();
// Cegah salah arah: tujuan harus database dev lokal.
const { rows: [who] } = await dst.query("select current_database() as db, inet_server_port() as port");
if (who.db !== "swim_dev" || who.port !== 54330) throw new Error("Tujuan bukan database dev lokal, dibatalkan");

await src.query("begin transaction isolation level repeatable read read only");
const { rows: tables } = await src.query(
  `select table_name from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> '_prisma_migrations'`,
);

await dst.query("begin");
await dst.query("set session_replication_role = replica"); // abaikan urutan FK saat menyalin
for (const { table_name: t } of tables) {
  const { rows } = await src.query(`select * from "${t}"`);
  await dst.query(`delete from "${t}"`);
  for (const row of rows) {
    const cols = Object.keys(row);
    // Kolom json(b) datang sebagai objek -> kirim sebagai teks JSON; array Postgres & Date biarkan.
    const values = cols.map((c) => {
      const v = row[c];
      const isPlainObject = v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && !Buffer.isBuffer(v);
      return isPlainObject ? JSON.stringify(v) : v;
    });
    await dst.query(
      `insert into "${t}" (${cols.map((c) => `"${c}"`).join(",")}) values (${cols.map((_, i) => `$${i + 1}`).join(",")})`,
      values,
    );
  }
  console.log(`${t}: ${rows.length} baris`);
}
await dst.query("commit");
await src.query("commit");
await src.end();
await dst.end();
console.log("Selesai: database dev berisi salinan data production.");
