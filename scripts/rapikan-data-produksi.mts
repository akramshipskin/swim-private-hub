/**
 * Rapikan data produksi (keputusan Hadi 30 Sep 2026). Tiga langkah:
 *   1. MATIKAN paket uji (harga <= Rp10.000, bukan trial): Renang 1x Rp5.000
 *      dan Renang 1 Menit Rp10.000 -> isActive=false (tidak dijual lagi,
 *      riwayat pembelian tetap utuh).
 *   2. BAGI HASIL: kolam yang masih memakai angka bawaan lama (komisi 15%,
 *      coach 55%) diubah ke 10% / 40% (kolam 50%). Kolam dengan angka lain
 *      TIDAK disentuh (berarti sudah diatur sendiri).
 *   3. PAKET TRIAL: tiap kolam aktif yang belum punya paket trial aktif dibuatkan
 *      "Trial 1 Sesi" (1 sesi, berlaku 14 hari, jatah batal 1). Harga bawaan
 *      Rp50.000 -- ubah lewat --trial-price=NNNNN atau nanti di Admin > Paket.
 *
 * Default = HANYA MENAMPILKAN rencana, tidak mengubah apa pun. Tambah --apply
 * untuk menjalankan. Aman dijalankan berulang (langkah yang sudah beres dilewati).
 *
 * Jalankan (produksi):
 *   set -a && . ./.env.prod && set +a && \
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/rapikan-data-produksi.mts          # lihat rencana
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/rapikan-data-produksi.mts --apply  # jalankan
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const apply = process.argv.includes("--apply");
const priceArg = process.argv.find((a) => a.startsWith("--trial-price="));
const trialPrice = priceArg ? Number(priceArg.split("=")[1]) : 50_000;
if (!Number.isInteger(trialPrice) || trialPrice < 1) {
  console.error("--trial-price harus angka bulat rupiah minimal 1");
  process.exit(1);
}
const OLD_DEFAULT = { commissionPercent: 15, coachSharePercent: 55 };
const NEW_SPLIT = { commissionPercent: 10, coachSharePercent: 40 };

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
console.log(`Mode: ${apply ? "JALANKAN (--apply)" : "LIHAT SAJA (tanpa --apply)"}\n`);

// 1. Paket uji
const testTemplates = await prisma.packageTemplate.findMany({
  where: { price: { lte: 10_000 }, isTrial: false, isActive: true },
  select: { id: true, name: true, price: true, pool: { select: { name: true } } },
  orderBy: [{ pool: { name: "asc" } }, { price: "asc" }],
});
console.log(`1. Paket uji aktif (harga <= Rp10.000): ${testTemplates.length}`);
for (const t of testTemplates) console.log(`   - ${t.pool.name}: ${t.name} (Rp${t.price}) -> dimatikan`);
if (apply && testTemplates.length) {
  const r = await prisma.packageTemplate.updateMany({ where: { id: { in: testTemplates.map((t) => t.id) } }, data: { isActive: false } });
  console.log(`   selesai: ${r.count} paket dimatikan`);
}

// 2. Bagi hasil
const pools = await prisma.pool.findMany({
  select: { id: true, name: true, isActive: true, commissionPercent: true, coachSharePercent: true },
  orderBy: { name: "asc" },
});
console.log(`\n2. Bagi hasil kolam (komisi / coach / kolam):`);
const toChange = pools.filter((p) => p.commissionPercent === OLD_DEFAULT.commissionPercent && p.coachSharePercent === OLD_DEFAULT.coachSharePercent);
for (const p of pools) {
  const now = `${p.commissionPercent}/${p.coachSharePercent}/${100 - p.commissionPercent - p.coachSharePercent}`;
  const plan = toChange.includes(p) ? `-> ${NEW_SPLIT.commissionPercent}/${NEW_SPLIT.coachSharePercent}/${100 - NEW_SPLIT.commissionPercent - NEW_SPLIT.coachSharePercent}` : "(dibiarkan)";
  console.log(`   - ${p.name}: ${now} ${plan}`);
}
if (apply && toChange.length) {
  const r = await prisma.pool.updateMany({ where: { id: { in: toChange.map((p) => p.id) } }, data: NEW_SPLIT });
  console.log(`   selesai: ${r.count} kolam diubah`);
}

// 3. Paket trial per kolam aktif
const activePools = pools.filter((p) => p.isActive);
const withTrial = await prisma.packageTemplate.findMany({ where: { isTrial: true, isActive: true }, select: { poolId: true } });
const hasTrial = new Set(withTrial.map((t) => t.poolId));
const needTrial = activePools.filter((p) => !hasTrial.has(p.id));
console.log(`\n3. Paket trial: ${needTrial.length} dari ${activePools.length} kolam aktif belum punya (harga Rp${trialPrice})`);
for (const p of needTrial) console.log(`   - ${p.name} -> buat "Trial 1 Sesi"`);
if (apply) {
  for (const p of needTrial) {
    // Nama unik per kolam (aturan aplikasi); kalau nama sudah terpakai oleh paket
    // lama yang nonaktif, pakai nama lain.
    const taken = await prisma.packageTemplate.count({ where: { poolId: p.id, name: "Trial 1 Sesi" } });
    const name = taken ? `Trial 1 Sesi (${new Date().toISOString().slice(0, 10)})` : "Trial 1 Sesi";
    await prisma.packageTemplate.create({
      data: { poolId: p.id, name, totalSesi: 1, price: trialPrice, durationDays: 14, jatahCancel: 1, isTrial: true, isActive: true },
    });
    console.log(`   dibuat: ${p.name} -> ${name}`);
  }
}

console.log(apply ? "\nSelesai." : "\nIni hanya rencana. Tambah --apply untuk menjalankan.");
await prisma.$disconnect();
