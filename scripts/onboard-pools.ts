import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

// Onboarding script buat jaringan kolam existing (locked
// /plan-eng-review 2026-09-12, Approach B Phase 1) -- seed script,
// BUKAN admin UI (Step 0 scope trim: CRUD page buat 4 kolam gak worth
// dibangun). Idempotent: aman dijalanin berkali-kali, gak bikin
// Pool/PoolAffiliation duplikat.
//
// Cara pakai:
//   1. cp scripts/onboard-pools.config.example.json scripts/onboard-pools.config.json
//   2. Isi data kolam ASLI (nama, alamat, nomor HP owner & coach yang
//      akunnya udah ada di sistem).
//   3. npm run onboard:pools

type PoolSeed = {
  poolName: string;
  address?: string;
  contactPhone?: string;
  // Nomor HP User yang jadi owner kolam ini -- HARUS udah punya akun
  // (biasanya migrasi dari akun ADMIN les-renang-cianjur lama).
  ownerPhone: string;
  coachPhones?: string[];
};

function loadConfig(): PoolSeed[] {
  const configPath = path.join(process.cwd(), "scripts/onboard-pools.config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config gak ketemu di ${configPath}. Copy dari scripts/onboard-pools.config.example.json, ` +
        `isi data kolam asli, baru jalanin lagi.`
    );
  }
  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = JSON.parse(raw) as PoolSeed[];
  if (!Array.isArray(parsed)) {
    throw new Error("Config harus berupa array of pool seed objects.");
  }
  return parsed;
}

async function onboardPool(seed: PoolSeed) {
  const owner = await prisma.user.findUnique({ where: { phone: seed.ownerPhone } });
  if (!owner) {
    console.error(
      `[SKIP] Owner dengan nomor ${seed.ownerPhone} (kolam "${seed.poolName}") tidak ditemukan -- pastikan akunnya udah ada dulu.`
    );
    return;
  }

  // Idempotency: cek dulu apa Pool ini udah ada (by ownerUserId) sebelum
  // create -- ini yang nutup gap "script dijalanin 2x bikin duplikat"
  // dari Failure modes /plan-eng-review.
  let pool = await prisma.pool.findFirst({ where: { ownerUserId: owner.id } });
  if (pool) {
    console.log(
      `[SKIP-CREATE] Pool "${seed.poolName}" udah ada (id=${pool.id}), owner udah ke-link. Lanjut cek role & affiliation.`
    );
  } else {
    pool = await prisma.pool.create({
      data: {
        name: seed.poolName,
        address: seed.address,
        contactPhone: seed.contactPhone,
        ownerUserId: owner.id,
      },
    });
    console.log(`[CREATED] Pool "${seed.poolName}" (id=${pool.id})`);
  }

  // WAJIB, nutup celah data-isolation dari /plan-eng-review 2026-09-12:
  // owner yang di-migrate TIDAK BOLEH tetep ADMIN (unrestricted access
  // ke SEMUA kolam lain, bukan cuma kolamnya sendiri). POOL_OWNER
  // (ditambah pas fitur wallet) kasih akses ke wallet & pencairan kolam
  // ini doang -- lihat src/app/pool/.
  if (owner.role !== "POOL_OWNER") {
    const fromRole = owner.role;
    await prisma.user.update({ where: { id: owner.id }, data: { role: "POOL_OWNER" } });
    console.log(`[ROLE CHANGED] ${owner.name} (${owner.phone}): ${fromRole} -> POOL_OWNER`);
  }

  for (const coachPhone of seed.coachPhones ?? []) {
    const coach = await prisma.user.findUnique({ where: { phone: coachPhone } });
    if (!coach) {
      console.error(
        `[SKIP] Coach dengan nomor ${coachPhone} tidak ditemukan buat kolam "${seed.poolName}".`
      );
      continue;
    }
    await prisma.poolAffiliation.upsert({
      where: { poolId_coachId: { poolId: pool.id, coachId: coach.id } },
      update: {},
      create: { poolId: pool.id, coachId: coach.id },
    });
    console.log(`[AFFILIATED] ${coach.name} (${coach.phone}) -> "${seed.poolName}"`);
  }
}

async function main() {
  const seeds = loadConfig();
  for (const seed of seeds) {
    await onboardPool(seed);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
