import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { assertDependentOwnedByMember } from "@/lib/dependents";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId, dependentId } = (await request.json()) as {
    templateId?: string;
    dependentId?: string;
  };

  if (!dependentId) {
    return Response.json({ error: "Pilih anak dulu" }, { status: 400 });
  }
  try {
    await assertDependentOwnedByMember(dependentId, session.user.id);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Anak gak valid" },
      { status: 403 }
    );
  }

  const template = templateId
    ? await prisma.packageTemplate.findFirst({
        where: { id: templateId, isActive: true, pool: { isActive: true } },
      })
    : null;

  if (!template) {
    return Response.json({ error: "Paket tidak valid" }, { status: 400 });
  }

  const pkg = await prisma.package.create({
    data: {
      memberId: session.user.id,
      dependentId,
      poolId: template.poolId,
      templateId: template.id,
      name: template.name,
      totalSesi: template.totalSesi,
      sisaSesi: template.totalSesi,
      jatahCancel: template.jatahCancel,
      status: "PENDING_PAYMENT",
    },
  });

  const orderId = `PKG-${pkg.id}-${Date.now()}`;
  const origin = new URL(request.url).origin;

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
      callbacks: {
        finish: `${origin}/pembayaran/sukses`,
        unfinish: `${origin}/pembayaran/gagal`,
        error: `${origin}/pembayaran/gagal`,
      },
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
    await prisma.package.delete({ where: { id: pkg.id } });
    return Response.json(
      {
        error: "Gagal membuat transaksi pembayaran. Cek kredensial Midtrans di .env.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
