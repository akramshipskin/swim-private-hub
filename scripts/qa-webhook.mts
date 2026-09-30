// Simulasi notifikasi Midtrans untuk uji LOKAL: webhook asli tidak bisa masuk ke
// localhost, jadi skrip ini mengirim notifikasi bertanda tangan ke server dev
// (http://localhost:3100) memakai kunci server dari env aplikasi sendiri
// (kunci tidak dicetak). Menolak jalan kalau targetnya bukan localhost.
//
//   npx tsx --env-file=.env --env-file=.env.local scripts/qa-webhook.mts <orderId> <status> [grossAmount]
//   status: settlement | pending | deny | cancel | expire | capture-accept | capture-challenge | capture-deny
//   grossAmount bawaan = jumlah tagihan di DB (beri angka lain untuk menguji ketidakcocokan).
import crypto from "node:crypto";
import { prisma } from "../src/lib/prisma";

const target = process.env.QA_WEBHOOK_URL ?? "http://localhost:3100/api/payment/webhook";
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(target)) {
  console.error("Ditolak: target webhook bukan localhost.");
  process.exit(1);
}
const [orderId, status, grossArg] = process.argv.slice(2);
if (!orderId || !status) {
  console.error("Pemakaian: qa-webhook.mts <orderId> <status> [grossAmount]");
  process.exit(1);
}
const serverKey = process.env.MIDTRANS_SERVER_KEY;
if (!serverKey) {
  console.error("MIDTRANS_SERVER_KEY tidak ada di env.");
  process.exit(1);
}

const payment = await prisma.payment.findUnique({ where: { midtransOrderId: orderId }, select: { amount: true } });
const gross = grossArg ?? `${payment?.amount ?? 0}.00`;
const [transaction_status, fraud_status] = status.startsWith("capture-")
  ? ["capture", status.replace("capture-", "")]
  : [status, undefined];
const status_code = transaction_status === "deny" ? "202" : transaction_status === "pending" ? "201" : "200";
const signature_key = crypto.createHash("sha512").update(orderId + status_code + gross + serverKey).digest("hex");

const res = await fetch(target, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ order_id: orderId, status_code, gross_amount: gross, signature_key, transaction_status, fraud_status }),
});
console.log(res.status, await res.text());
await prisma.$disconnect();
process.exit(0);
