/**
 * Reset 2FA admin yang kehilangan HP. Setelah ini admin login pakai password
 * saja, lalu otomatis diarahkan ke /keamanan untuk memasang 2FA baru.
 *
 * Jalankan (produksi):
 *   set -a && . ./.env.prod && set +a && \
 *   DATABASE_URL="$PROD_DIRECT_URL" npx tsx scripts/reset-admin-2fa.mts <email-atau-no-hp-admin>
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const identifier = process.argv[2];
if (!identifier) {
  console.error("Pakai: npx tsx scripts/reset-admin-2fa.mts <email-atau-no-hp-admin>");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const res = await prisma.user.updateMany({
  where: { role: "ADMIN", OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
  data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null, sessionVersion: { increment: 1 } },
});
console.log(res.count === 1 ? "2FA direset. Semua sesi admin ini ikut keluar." : `Tidak ada admin cocok (${res.count}).`);
await prisma.$disconnect();
