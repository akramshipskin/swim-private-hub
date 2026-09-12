import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { platformServerKey } from "@/lib/midtrans";
import { creditPoolFromPackageSale } from "@/lib/wallet";
import type { Prisma } from "@/generated/prisma/client";

// Signature Midtrans dihitung pake Server Key platform -- service
// provider posture (revisi 2026-09-12), 1 akun Midtrans buat semua kolam.
function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
) {
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + platformServerKey())
    .digest("hex");
  return expected === signatureKey;
}

export async function POST(request: Request) {
  // Midtrans WAJIB dapet HTTP 200 apapun hasilnya (ketauan lewat tombol
  // "Test notification URL" di dashboard yang gagal terus pas endpoint ini
  // masih balikin 400/403/404/500) -- kalau kita balikin status lain,
  // Midtrans nganggep notifikasi gagal terkirim dan retry terus / nge-flag
  // integrasi ini bermasalah, walau di sisi kita errornya emang valid
  // (payload gak lengkap, dsb). Jadi semua error path di bawah tetep
  // return 200, detail error taruh di body doang buat debugging kita
  // sendiri (bukan buat Midtrans baca).
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: true, error: "Body bukan JSON valid" });
  }

  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: transactionStatus,
  } = body as {
    order_id?: string;
    status_code?: string;
    gross_amount?: string;
    signature_key?: string;
    transaction_status?: string;
  };

  if (!orderId || !signatureKey) {
    return Response.json({ ok: true, error: "Payload tidak lengkap" });
  }

  if (!verifySignature(orderId, statusCode ?? "", grossAmount ?? "", signatureKey)) {
    return Response.json({ ok: true, error: "Signature tidak valid" });
  }

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
    include: { package: { include: { template: true } } },
  });

  if (!payment) {
    return Response.json({ ok: true, error: "Payment tidak ditemukan" });
  }

  // Midtrans bisa ngirim ulang notifikasi yang sama (retry kalau endpoint
  // kita gak balikin 200 tepat waktu, atau emang kadang dobel dari sisi
  // mereka) -- kalau payment ini UDAH SUCCESS sebelumnya dan notifikasi
  // yang dateng juga capture/settlement (bukan status baru), ini notif
  // duplikat: gak boleh reset startDate/expiredDate paket ATAU kredit
  // wallet kolam lagi, ntar saldo/masa berlaku ke-double diem-diem tiap
  // kali Midtrans retry.
  if (
    payment.status === "SUCCESS" &&
    (transactionStatus === "capture" || transactionStatus === "settlement")
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { rawWebhookPayload: body as Prisma.InputJsonValue },
    });
    return Response.json({ ok: true });
  }

  let paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" = "PENDING";
  let packageStatus: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | null = null;

  if (transactionStatus === "capture" || transactionStatus === "settlement") {
    paymentStatus = "SUCCESS";
    packageStatus = "ACTIVE";
  } else if (transactionStatus === "deny" || transactionStatus === "cancel") {
    paymentStatus = "FAILED";
    packageStatus = "EXPIRED";
  } else if (transactionStatus === "expire") {
    paymentStatus = "EXPIRED";
    packageStatus = "EXPIRED";
  } else if (transactionStatus === "pending") {
    paymentStatus = "PENDING";
  }

  const durationDays = payment.package.template?.durationDays ?? 60;
  const now = new Date();
  const expiredDate = new Date(now);
  expiredDate.setDate(expiredDate.getDate() + durationDays);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: paymentStatus, rawWebhookPayload: body as Prisma.InputJsonValue },
    });

    if (packageStatus) {
      await tx.package.update({
        where: { id: payment.packageId },
        data: {
          status: packageStatus,
          ...(packageStatus === "ACTIVE" ? { startDate: now, expiredDate } : {}),
        },
      });
    }

    // Kolam dikredit sekali doang, pas payment BENERAN transisi ke
    // SUCCESS (bukan tiap notifikasi capture/settlement -- guard duplikat
    // di atas udah nangkep retry, blok ini cuma jalan pas payment.status
    // SEBELUMNYA bukan SUCCESS).
    if (paymentStatus === "SUCCESS") {
      await creditPoolFromPackageSale(tx, {
        poolId: payment.package.poolId,
        paymentId: payment.id,
        grossAmount: payment.amount,
      });
    }
  });

  return Response.json({ ok: true });
}
