import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = (await request.json()) as { templateId?: string };

  const template = templateId
    ? await prisma.packageTemplate.findFirst({
        where: { id: templateId, isActive: true },
      })
    : null;

  if (!template) {
    return Response.json({ error: "Paket tidak valid" }, { status: 400 });
  }

  const pkg = await prisma.package.create({
    data: {
      memberId: session.user.id,
      templateId: template.id,
      name: template.name,
      totalSesi: template.totalSesi,
      sisaSesi: template.totalSesi,
      status: "PENDING_PAYMENT",
    },
  });

  const orderId = `PKG-${pkg.id}-${Date.now()}`;

  try {
    const transaction = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: template.price },
      customer_details: {
        first_name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      },
      item_details: [
        {
          id: template.id,
          price: template.price,
          quantity: 1,
          name: template.name,
        },
      ],
    });

    await prisma.payment.create({
      data: {
        packageId: pkg.id,
        midtransOrderId: orderId,
        amount: template.price,
        status: "PENDING",
      },
    });

    return Response.json({ redirectUrl: transaction.redirect_url });
  } catch (err) {
    // Rollback package biar gak nyangkut PENDING_PAYMENT selamanya kalau
    // Midtrans gagal dipanggil (misal kredensial belum diisi).
    await prisma.package.delete({ where: { id: pkg.id } });
    return Response.json(
      {
        error:
          "Gagal membuat transaksi pembayaran. Cek kredensial Midtrans di .env.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
