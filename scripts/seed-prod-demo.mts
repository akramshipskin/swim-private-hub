/**
 * Seed data demo yang sama dengan DB dev ke DB tujuan (dipakai sekali untuk
 * production setelah migrasi 20260917175021_coach_birth_gender_pool_photos).
 *
 * Idempoten: semua tulisan pakai update/upsert berdasarkan email coach dan
 * nama kolam, jadi aman dijalankan ulang. Kalau baris yang dicari tidak ada,
 * skrip berhenti dengan pesan jelas -- bukan diam-diam membuat data baru.
 *
 * Yang TIDAK disentuh: Pool.photos (foto kolam diunggah sendiri lewat menu
 * Info Kolam) dan bio/specialties coach lama (sudah ada di production).
 *
 * Jalankan:
 *   set -a && . ./.env.prod && set +a && \
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/seed-prod-demo.mts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const COACH_BIO_DATA = [
  { email: "ayu.coach@example.com", birthDate: "1996-04-12", gender: "FEMALE" },
  { email: "dewi.coach@example.com", birthDate: "1992-11-03", gender: "FEMALE" },
  { email: "fajar.coach@example.com", birthDate: "1989-02-20", gender: "MALE" },
  { email: "rian.coach@example.com", birthDate: "1998-07-30", gender: "MALE" },
] as const;

const POOL_INFO = [
  {
    name: "Kolam Renang Melati",
    description:
      "Kolam outdoor 25 meter dengan kolam anak terpisah kedalaman 60 cm. Air diganti berkala, ada area tunggu beratap buat orang tua.",
    facilities: [
      "Toilet",
      "Kamar bilas / shower",
      "Mushola",
      "Warung / kantin",
      "Area tunggu orang tua",
      "Parkir motor",
      "Parkir mobil",
      "Kolam anak",
    ],
  },
  {
    name: "Kolam Renang Tirta Asri",
    description:
      "Kolam semi-indoor 20 meter, kedalaman 1,2-1,8 meter. Suasana tenang, cocok buat les privat dewasa dan remaja.",
    facilities: [
      "Toilet",
      "Kamar bilas / shower",
      "Loker",
      "Ruang ganti",
      "Wi-Fi",
      "Sewa handuk / pelampung",
      "Parkir motor",
      "Area tunggu orang tua",
    ],
  },
] as const;

const NADIA = {
  name: "Nadia Puspita",
  email: "nadia.coach@example.com",
  password: "qwertyuiop",
  birthDate: "1994-06-08",
  gender: "FEMALE",
  bio: "Coach renang spesialis anak usia dini dan kelas perempuan.",
  specialties: ["Renang anak usia dini", "Gaya bebas", "Renang bayi & balita"],
  certificationNote: "Sertifikat Pelatih Renang Anak",
  pools: ["Kolam Renang Melati", "Kolam Renang Tirta Asri"],
} as const;

async function main() {
  const missing: string[] = [];

  for (const coach of COACH_BIO_DATA) {
    const user = await prisma.user.findUnique({
      where: { email: coach.email },
      select: { id: true, coachProfile: { select: { id: true } } },
    });
    if (!user?.coachProfile) {
      missing.push(`coach ${coach.email}`);
      continue;
    }
    await prisma.coachProfile.update({
      where: { id: user.coachProfile.id },
      data: { birthDate: new Date(coach.birthDate), gender: coach.gender },
    });
    console.log(`ok  coach ${coach.email}: birthDate + gender`);
  }

  for (const pool of POOL_INFO) {
    const row = await prisma.pool.findFirst({
      where: { name: pool.name },
      select: { id: true },
    });
    if (!row) {
      missing.push(`kolam ${pool.name}`);
      continue;
    }
    await prisma.pool.update({
      where: { id: row.id },
      data: { description: pool.description, facilities: [...pool.facilities] },
    });
    console.log(`ok  kolam ${pool.name}: deskripsi + fasilitas`);
  }

  const nadiaPools = await prisma.pool.findMany({
    where: { name: { in: [...NADIA.pools] } },
    select: { id: true, name: true },
  });
  for (const name of NADIA.pools) {
    if (!nadiaPools.some((p) => p.name === name)) {
      missing.push(`kolam ${name} (afiliasi Nadia)`);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Data berikut tidak ditemukan di DB tujuan:\n- ${missing.join("\n- ")}`);
  }

  const passwordHash = await bcrypt.hash(NADIA.password, 10);
  const nadia = await prisma.user.upsert({
    where: { email: NADIA.email },
    update: {},
    create: {
      name: NADIA.name,
      email: NADIA.email,
      passwordHash,
      role: "COACH",
    },
    select: { id: true },
  });
  await prisma.coachProfile.upsert({
    where: { userId: nadia.id },
    update: {
      birthDate: new Date(NADIA.birthDate),
      gender: NADIA.gender,
      bio: NADIA.bio,
      specialties: [...NADIA.specialties],
      hasCertification: true,
      certificationNote: NADIA.certificationNote,
      certificateStatus: "APPROVED",
    },
    create: {
      userId: nadia.id,
      birthDate: new Date(NADIA.birthDate),
      gender: NADIA.gender,
      bio: NADIA.bio,
      specialties: [...NADIA.specialties],
      hasCertification: true,
      certificationNote: NADIA.certificationNote,
      certificateStatus: "APPROVED",
    },
  });
  for (const pool of nadiaPools) {
    await prisma.poolAffiliation.upsert({
      where: { poolId_coachId: { poolId: pool.id, coachId: nadia.id } },
      update: {},
      create: { poolId: pool.id, coachId: nadia.id },
    });
  }
  console.log(`ok  coach ${NADIA.email}: profil + afiliasi ${nadiaPools.length} kolam`);
  console.log("Selesai.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
