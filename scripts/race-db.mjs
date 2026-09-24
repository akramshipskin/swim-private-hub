// Postgres 17 lokal KHUSUS tes race condition (tests/race), terpisah dari DB
// dev (dev-db.mjs, port 54330) supaya tes yang mengosongkan tabel tidak
// menyentuh data dev.
//
//   npm run db:race   -> nyalakan + migrasi (biarkan terminal ini terbuka)
//   npm run test:race -> (terminal lain) jalankan tes race
//
// Alamat: postgresql://qa:qa@localhost:54329/race. Tes menolak jalan kalau
// DATABASE_URL bukan alamat ini (lihat tests/race/setup.ts).
//
// Binary Postgres dipasang di .dev-db/ oleh dev-db.mjs (di-gitignore); jalankan
// `npm run db:dev` sekali dulu kalau .dev-db/ belum ada.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, ".dev-db");
const DATA = path.join(DIR, "race-data");
const RACE_DB = { port: 54329, user: "qa", password: "qa", database: "race" };

if (!existsSync(path.join(DIR, "node_modules", "embedded-postgres"))) {
  console.error("Binary Postgres belum terpasang. Jalankan `npm run db:dev` sekali dulu, lalu Ctrl+C, lalu ulangi perintah ini.");
  process.exit(1);
}

const require = createRequire(path.join(DIR, "package.json"));
const EmbeddedPostgres = require("embedded-postgres").default;

const pg = new EmbeddedPostgres({
  databaseDir: DATA,
  user: RACE_DB.user,
  password: RACE_DB.password,
  port: RACE_DB.port,
  persistent: true,
});

if (!existsSync(path.join(DATA, "PG_VERSION"))) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase(RACE_DB.database);
} catch {
  // sudah ada
}

const url = `postgresql://${RACE_DB.user}:${RACE_DB.password}@localhost:${RACE_DB.port}/${RACE_DB.database}`;
// Skema di-deploy lewat migrasi asli (bukan db push) -- sama dengan production.
execSync("npx prisma migrate deploy", { cwd: ROOT, stdio: "inherit", env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url } });

console.log(`Postgres race jalan: ${url}`);
console.log("Biarkan terminal ini terbuka. Ctrl+C untuk mematikan.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
