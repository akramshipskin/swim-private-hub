import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { prisma } from "@/lib/prisma";
import { reset, mkPool } from "./fx";

// Migrasi 20260926090000_validate_money_checks: VALIDATE 2 pagar saldo yang
// sebelumnya NOT VALID. Bukan tes balapan (migrasi dijalankan sekali oleh
// Hadi) -- yang dibuktikan: migrasi lolos di data bersih dan GAGAL dengan
// pesan jelas kalau ada baris lama yang melanggar. Tiap kasus di dalam
// BEGIN..ROLLBACK, jadi DB race kembali seperti semula.

const MIG = path.resolve(__dirname, "../../prisma/migrations");
const validateSql = readFileSync(path.join(MIG, "20260926090000_validate_money_checks/migration.sql"), "utf8");
// Definisi CHECK diambil dari migrasi aslinya (bukan disalin) supaya tes ikut
// berubah kalau definisinya berubah.
const oldSql = readFileSync(path.join(MIG, "20260925120000_money_controls/migration.sql"), "utf8");
const addNotValid = oldSql.match(/ALTER TABLE "\w+" ADD CONSTRAINT "\w+" CHECK \([\s\S]*?\) NOT VALID;/g)!;
if (addNotValid.length !== 2) throw new Error("definisi 2 CHECK lama tidak ketemu di migrasi money_controls");

beforeEach(reset);

// Kembalikan keadaan "sebelum migrasi": sisipkan baris lama selagi pagar belum
// ada (seperti data produksi sebelum 25 Sep), lalu pasang pagar NOT VALID.
async function inOldState(seed: (c: Client) => Promise<void>) {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query(`ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_owner_matches_type"`);
    await c.query(`ALTER TABLE "WithdrawalRequest" DROP CONSTRAINT "WithdrawalRequest_exactly_one_owner"`);
    await seed(c);
    for (const sql of addNotValid) await c.query(sql);
    try {
      await c.query(validateSql);
      return "ok";
    } catch (e) {
      return (e as Error).message;
    }
  } finally {
    await c.query("ROLLBACK");
    await c.end();
  }
}

describe("Migrasi VALIDATE 2 pagar saldo", () => {
  it("V1: setelah migrate deploy, kedua constraint sudah tervalidasi penuh", async () => {
    const rows = await prisma.$queryRaw<{ conname: string; convalidated: boolean }[]>`
      SELECT conname, convalidated FROM pg_constraint
      WHERE conname IN ('WalletTransaction_owner_matches_type', 'WithdrawalRequest_exactly_one_owner') ORDER BY conname`;
    expect(rows).toEqual([
      { conname: "WalletTransaction_owner_matches_type", convalidated: true },
      { conname: "WithdrawalRequest_exactly_one_owner", convalidated: true },
    ]);
  });

  it("V2: data lama bersih (baris sah) -> migrasi lolos", async () => {
    const pool = await mkPool();
    const res = await inOldState(async (c) => {
      await c.query(`INSERT INTO "WalletTransaction" (id, type, "poolId", amount) VALUES ('wt-ok', 'SESSION_REVENUE', $1, 1000)`, [pool.id]);
      await c.query(`INSERT INTO "WithdrawalRequest" (id, "poolId", amount, "bankName", "bankAccountNumber", "bankAccountName") VALUES ('wr-ok', $1, 1000, 'BCA', '1', 'X')`, [pool.id]);
    });
    expect(res).toBe("ok");
  });

  it("V3: ada 1 pembukuan lama salah pemilik -> migrasi gagal menyebut WalletTransaction_owner_matches_type", async () => {
    const pool = await mkPool();
    const res = await inOldState(async (c) => {
      // Bayaran coach tapi tercatat ke kolam.
      await c.query(`INSERT INTO "WalletTransaction" (id, type, "poolId", amount) VALUES ('wt-bad', 'SESSION_PAYOUT', $1, 1000)`, [pool.id]);
    });
    expect(res).toMatch(/WalletTransaction_owner_matches_type/);
  });

  it("V4: ada 1 pencairan lama tanpa pemilik -> migrasi gagal menyebut WithdrawalRequest_exactly_one_owner", async () => {
    const res = await inOldState(async (c) => {
      await c.query(`INSERT INTO "WithdrawalRequest" (id, amount, "bankName", "bankAccountNumber", "bankAccountName") VALUES ('wr-bad', 1000, 'BCA', '1', 'X')`);
    });
    expect(res).toMatch(/WithdrawalRequest_exactly_one_owner/);
  });
});
