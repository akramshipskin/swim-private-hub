// Postgres 17 lokal untuk development, supaya `npm run dev` dan eksperimen
// tidak menyentuh database production.
//
//   npm run db:dev        -> nyalakan Postgres lokal (biarkan terminal ini terbuka)
//   npm run db:dev:sync   -> (terminal lain) migrasi + salin data dari production
//
// Binary Postgres dipasang di .dev-db/ (di-gitignore), BUKAN di package.json,
// supaya build Vercel tidak ikut mengunduh ~135MB binary per OS.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, ".dev-db");
const DATA = path.join(DIR, "data");
export const DEV_DB = { port: 54330, user: "dev", password: "dev", database: "swim_dev" };

if (!existsSync(path.join(DIR, "node_modules", "embedded-postgres"))) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(path.join(DIR, "package.json"), '{ "name": "swim-dev-db", "private": true }\n');
  console.log("Memasang embedded-postgres ke .dev-db/ (sekali saja)...");
  execSync("npm install embedded-postgres@17.9.0-beta.17", { cwd: DIR, stdio: "inherit" });
}

const require = createRequire(path.join(DIR, "package.json"));
const EmbeddedPostgres = require("embedded-postgres").default;

const pg = new EmbeddedPostgres({
  databaseDir: DATA,
  user: DEV_DB.user,
  password: DEV_DB.password,
  port: DEV_DB.port,
  persistent: true,
});

if (!existsSync(path.join(DATA, "PG_VERSION"))) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase(DEV_DB.database);
} catch {
  // sudah ada
}
console.log(`Postgres dev jalan: postgresql://${DEV_DB.user}:${DEV_DB.password}@localhost:${DEV_DB.port}/${DEV_DB.database}`);
console.log("Biarkan terminal ini terbuka. Ctrl+C untuk mematikan.");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
