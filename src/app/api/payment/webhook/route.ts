import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  return expected === signatureKey;
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: transactionStatus,
  } = body;

  if (!orderId || !signatureKey) {
    return Response.json({ error: "Payload tidak lengkap" }, { status: 400 });
  }

  if (!verifySignature(orderId, statusCode, grossAmount, signatureKey)) {
    return Response.json({ error: "Signature tidak valid" }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
  });

  if (!payment) {
    return Response.json({ error: "Payment tidak ditemukan" }, { status: 404 });
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

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: paymentStatus, rawWebhookPayload: body },
    }),
    ...(packageStatus
      ? [
          prisma.package.update({
            where: { id: payment.packageId },
            data: {
              status: packageStatus,
              ...(packageStatus === "ACTIVE" ? { startDate: new Date() } : {}),
            },
          }),
        ]
      : []),
  ]);

  return Response.json({ ok: true });
}
