/**
 * Kolam & coach contoh untuk landing (keputusan Hadi 30 Sep 2026): landing
 * menampilkan maksimal 5 kolam; kolam asli menggeser kolam contoh satu per
 * satu (src/lib/landing-rank.ts), jadi slot yang kosong diisi kolam contoh.
 *   1. Buat kolam contoh sampai jumlah kolam aktif mencapai 5 (nama di
 *      DEMO_POOL_NAMES). Tiap kolam baru dapat paket 4x Rp400.000 dan 8x
 *      Rp750.000, jam buka 06.00-20.00, dan foto contoh.
 *   2. Beri foto contoh ke kolam contoh yang belum punya foto.
 *   3. Beri foto contoh ke coach contoh (email @example.com) yang belum punya foto.
 *   4. Hubungkan tiap coach contoh ke tiap kolam contoh yang belum terhubung
 *      (supaya kartu kolam di landing tidak menampilkan 0 coach).
 * Foto contoh = gambar ilustrasi di public/demo/ (bukan foto asli).
 *
 * Default = HANYA MENAMPILKAN rencana. Tambah --apply untuk menjalankan. Aman
 * dijalankan berulang.
 *
 *   set -a && . ./.env.prod && set +a && \
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/fill-demo-pools.mts          # lihat rencana
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/fill-demo-pools.mts --apply  # jalankan
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_POOL_NAMES, LANDING_SLOTS, isDemoAccountEmail } from "../src/lib/landing-rank";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const NEW_POOLS: Record<string, { address: string; description: string; facilities: string[] }> = {
  "Kolam Renang Bahari": {
    address: "Jl. Contoh Bahari No. 12, Cianjur",
    description: "Kolam outdoor 25 meter dengan jalur khusus les privat di pagi hari. Ada area tunggu beratap untuk orang tua.",
    facilities: ["Toilet", "Kamar bilas / shower", "Mushola", "Warung / kantin", "Area tunggu orang tua", "Parkir motor"],
  },
  "Kolam Renang Cempaka": {
    address: "Jl. Contoh Cempaka No. 5, Cianjur",
    description: "Kolam semi-indoor 20 meter, air hangat di pagi hari. Cocok untuk anak yang baru belajar mengapung.",
    facilities: ["Toilet", "Kamar bilas / shower", "Loker", "Ruang ganti", "Kolam anak", "Parkir motor", "Parkir mobil"],
  },
  "Kolam Renang Samudra": {
    address: "Jl. Contoh Samudra No. 20, Cianjur",
    description: "Kolam 25 meter dengan kedalaman bertahap 1,0-1,6 meter. Suasana tenang, nyaman untuk remaja dan dewasa.",
    facilities: ["Toilet", "Kamar bilas / shower", "Mushola", "Wi-Fi", "Sewa handuk / pelampung", "Parkir mobil"],
  },
};
const POOL_PHOTO = (i: number) => `/demo/kolam-${(i % 5) + 1}.svg`;
const COACH_PHOTO = (i: number) => `/demo/coach-${(i % 5) + 1}.svg`;

console.log(`Mode: ${apply ? "JALANKAN (--apply)" : "LIHAT SAJA (tanpa --apply)"}\n`);

const pools = await prisma.pool.findMany({ where: { isActive: true }, select: { id: true, name: true, photos: true }, orderBy: { name: "asc" } });
const missing = Math.max(0, LANDING_SLOTS - pools.length);
const existingNames = new Set(pools.map((p) => p.name));
const toCreate = DEMO_POOL_NAMES.filter((n) => NEW_POOLS[n] && !existingNames.has(n)).slice(0, missing);
console.log(`1. Kolam aktif: ${pools.length} (slot landing: ${LANDING_SLOTS}) -> buat ${toCreate.length} kolam contoh`);
for (const name of toCreate) console.log(`   - ${name}`);
if (apply) {
  for (const [i, name] of toCreate.entries()) {
    const info = NEW_POOLS[name];
    const pool = await prisma.pool.create({
      data: {
        name,
        address: info.address,
        description: info.description,
        facilities: info.facilities,
        openTime: "06:00",
        closeTime: "20:00",
        photos: [POOL_PHOTO(pools.length + i)],
        // Harga tiket contoh, sama dengan scripts/isi-harga-dummy.
        pricePack4: 260_000,
        pricePack8: 480_000,
      },
      select: { id: true },
    });
    console.log(`   dibuat: ${name} (${pool.id})`);
  }
}

const demoPoolsNoPhoto = pools.filter((p) => (DEMO_POOL_NAMES as readonly string[]).includes(p.name) && p.photos.length === 0);
console.log(`\n2. Kolam contoh tanpa foto: ${demoPoolsNoPhoto.length}`);
for (const [i, p] of demoPoolsNoPhoto.entries()) {
  console.log(`   - ${p.name} -> ${POOL_PHOTO(i)}`);
  if (apply) await prisma.pool.update({ where: { id: p.id }, data: { photos: [POOL_PHOTO(i)] } });
}

const coaches = await prisma.coachProfile.findMany({
  where: { photoUrl: null },
  select: { id: true, user: { select: { name: true, email: true } } },
  orderBy: { user: { name: "asc" } },
});
const demoCoaches = coaches.filter((c) => isDemoAccountEmail(c.user.email));
console.log(`\n3. Coach contoh tanpa foto: ${demoCoaches.length}`);
for (const [i, c] of demoCoaches.entries()) {
  console.log(`   - ${c.user.name} -> ${COACH_PHOTO(i)}`);
  if (apply) await prisma.coachProfile.update({ where: { id: c.id }, data: { photoUrl: COACH_PHOTO(i) } });
}

// 4. Afiliasi coach contoh <-> kolam contoh
const demoCoachUsers = await prisma.user.findMany({
  where: { role: "COACH", email: { endsWith: "@example.com", mode: "insensitive" } },
  select: { id: true, name: true },
});
const demoPoolRows = await prisma.pool.findMany({ where: { name: { in: [...DEMO_POOL_NAMES] } }, select: { id: true, name: true } });
const existingAff = new Set((await prisma.poolAffiliation.findMany({ select: { poolId: true, coachId: true } })).map((a) => `${a.poolId}:${a.coachId}`));
const missingAff = demoPoolRows.flatMap((p) => demoCoachUsers.filter((c) => !existingAff.has(`${p.id}:${c.id}`)).map((c) => ({ poolId: p.id, coachId: c.id, label: `${c.name} -> ${p.name}` })));
console.log(`\n4. Afiliasi coach contoh <-> kolam contoh yang belum ada: ${missingAff.length}`);
for (const a of missingAff) console.log(`   - ${a.label}`);
if (apply && missingAff.length) {
  await prisma.poolAffiliation.createMany({ data: missingAff.map(({ poolId, coachId }) => ({ poolId, coachId })), skipDuplicates: true });
}

console.log(apply ? "\nSelesai." : "\nIni hanya rencana. Tambah --apply untuk menjalankan.");
await prisma.$disconnect();
