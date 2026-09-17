import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { assertDependentOwnedByMember } from "@/lib/dependents";
import { dropInPrice, dropInEligibilityWhere } from "@/lib/drop-in";
import { withDedupeLock } from "@/lib/dedupe-lock";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId, dependentId, singleSessionPoolId } = (await request.json()) as {
    templateId?: string;
    dependentId?: string;
    singleSessionPoolId?: string;
  };

  if (!dependentId) {
    return Response.json({ error: "Pilih anak dulu" }, { status: 400 });
  }
  try {
    await assertDependentOwnedByMember(dependentId, session.user.id);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Anak tidak valid" },
      { status: 403 }
    );
  }

  // Yang dibeli: paket dari katalog (templateId), ATAU 1 sesi eceran di
  // kolam lain (singleSessionPoolId) -- harganya dihitung server dari
  // katalog kolam itu, gak pernah dipercaya dari client.
  let item: {
    poolId: string;
    templateId: string | null;
    name: string;
    totalSesi: number;
    jatahCancel: number;
    price: number;
    isSingleSession: boolean;
  };

  if (singleSessionPoolId) {
    const eligible = await prisma.package.count({ where: dropInEligibilityWhere(session.user.id) });
    if (eligible === 0) {
      return Response.json(
        { error: "Beli 1 sesi hanya bisa kalau kamu masih punya paket aktif. Beli paket dulu." },
        { status: 403 }
      );
    }
    const pool = await prisma.pool.findFirst({
      where: { id: singleSessionPoolId, isActive: true },
      select: {
        id: true,
        name: true,
        packageTemplates: { where: { isActive: true }, select: { price: true, totalSesi: true } },
      },
    });
    const price = pool ? dropInPrice(pool.packageTemplates) : null;
    if (!pool || price === null) {
      return Response.json({ error: "Kolam ini belum menjual 1 sesi" }, { status: 400 });
    }
    item = {
      poolId: pool.id,
      templateId: null,
      name: "1 Sesi",
      totalSesi: 1,
      // Batal 1x (min. 2 jam sebelum) -> sesinya balik, bisa dibooking
      // ulang di kolam ini selama masa berlaku.
      jatahCancel: 1,
      price,
      isSingleSession: true,
    };
  } else {
    const template = templateId
      ? await prisma.packageTemplate.findFirst({
          where: { id: templateId, isActive: true, pool: { isActive: true } },
        })
      : null;
    if (!template) {
      return Response.json({ error: "Paket tidak valid" }, { status: 400 });
    }
    item = {
      poolId: template.poolId,
      templateId: template.id,
      name: template.name,
      totalSesi: template.totalSesi,
      jatahCancel: template.jatahCancel,
      price: template.price,
      isSingleSession: false,
    };
  }

  // Klik Beli dobel (atau 2 tab) dulu bikin paket "Menunggu pembayaran"
  // numpuk. Tolak pembelian barang yang sama buat anak yang sama kalau
  // yang sebelumnya baru dibuat < 1 menit lalu.
  const pkg = await withDedupeLock(`checkout:${session.user.id}:${dependentId}`, async (tx) => {
    const recentDuplicate = await tx.package.findFirst({
      where: {
        memberId: session.user.id,
        dependentId,
        status: "PENDING_PAYMENT",
        poolId: item.poolId,
        templateId: item.templateId,
        isSingleSession: item.isSingleSession,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });
    if (recentDuplicate) return null;
    return tx.package.create({
      data: {
        memberId: session.user.id,
        dependentId,
        poolId: item.poolId,
        templateId: item.templateId,
        name: item.name,
        totalSesi: item.totalSesi,
        sisaSesi: item.totalSesi,
        jatahCancel: item.jatahCancel,
        isSingleSession: item.isSingleSession,
        status: "PENDING_PAYMENT",
      },
    });
  });
  if (!pkg) {
    return Response.json(
      { error: "Pembayaran untuk paket ini baru saja dibuat. Tunggu 1 menit sebelum coba lagi." },
      { status: 409 }
    );
  }

  const orderId = `PKG-${pkg.id}-${Date.now()}`;
  const origin = new URL(request.url).origin;

  try {
    const transaction = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: item.price },
      customer_details: {
        first_name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      },
      item_details: [
        {
          id: item.templateId ?? `single-${item.poolId}`,
          price: item.price,
          quantity: 1,
          // Midtrans nolak item name > 50 karakter.
          name: item.name.slice(0, 50),
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
        amount: item.price,
        status: "PENDING",
      },
    });

    return Response.json({ redirectUrl: transaction.redirect_url });
  } catch (err) {
    await prisma.package.delete({ where: { id: pkg.id } });
    return Response.json(
      {
        error: "Gagal membuat transaksi pembayaran. Coba lagi beberapa saat lagi.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
