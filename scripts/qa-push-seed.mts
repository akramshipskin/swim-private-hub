// Uji LOKAL notifikasi push: pasang langganan uji (alamat resmi palsu
// fcm.googleapis.com/fcm/send/qa-<HP>) untuk daftar nomor HP, lengkap dengan
// pasangan kunci pelanggan supaya scripts/qa-push-intercept.cjs bisa membaca
// isi pesannya. Menolak jalan kalau DATABASE_URL bukan lokal.
//
//   npx tsx --env-file=.env scripts/qa-push-seed.mts 089900000001 089900000002 ...
import crypto from "node:crypto";
import fs from "node:fs";
import { prisma } from "../src/lib/prisma";

if (!/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(process.env.DATABASE_URL ?? "")) {
  console.error("Ditolak: DATABASE_URL bukan database lokal.");
  process.exit(1);
}
const KEYS_FILE = process.env.QA_PUSH_KEYS ?? "/tmp/qa-push-keys.json";
const b64u = (b: Buffer) => b.toString("base64url");
const keys: Record<string, unknown> = {};
await prisma.pushSubscription.deleteMany({ where: { endpoint: { startsWith: "https://fcm.googleapis.com/fcm/send/qa-" } } });
for (const phone of process.argv.slice(2)) {
  const user = await prisma.user.findFirst({ where: { phone }, select: { id: true, name: true, role: true } });
  if (!user) {
    console.log(`${phone}: akun tidak ada, dilewati`);
    continue;
  }
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  const path = `/fcm/send/qa-${phone}`;
  await prisma.pushSubscription.create({
    data: { userId: user.id, endpoint: `https://fcm.googleapis.com${path}`, p256dh: b64u(ecdh.getPublicKey()), auth: b64u(auth) },
  });
  keys[path] = { user: `${user.role} ${user.name}`, priv: b64u(ecdh.getPrivateKey()), pub: b64u(ecdh.getPublicKey()), auth: b64u(auth) };
  console.log(`${phone}: ${user.role} ${user.name}`);
}
fs.writeFileSync(KEYS_FILE, JSON.stringify(keys));
process.exit(0);
