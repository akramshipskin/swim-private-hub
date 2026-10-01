import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { assertDependentOwnedByMember } from "@/lib/dependents";
import { packQuote, trialQuote } from "@/lib/pricing";
import { withDedupeLock } from "@/lib/dedupe-lock";
import { trialBlockingPackageWhere } from "@/lib/trial";

const NON_CARD_PAYMENTS = [
  "gopay",
  "shopeepay",
  "other_qris",
  "bca_va",
  "bni_va",
  "bri_va",
  "cimb_va",
  "permata_va",
  "echannel",
  "other_va",
] as const;

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.mustChangePassword) {
    return Response.json({ error: "Ganti password sementara dulu sebelum membeli paket." }, { status: 403 });
  }

  let body: { poolId?: string; coachId?: string; sesi?: number; dependentId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  const { poolId, coachId, sesi, dependentId } = body;

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

  // Model harga-dari-coach (Hadi 2 Okt): yang dibeli = kolam + coach + ukuran
  // paket (4/8 sesi, atau 1 = sesi coba). Harga dihitung server dari harga
  // kolam & coach saat ini, tidak pernah dipercaya dari browser. Paket katalog
  // lama dan beli 1 sesi eceran tidak dijual lagi.
  if (!poolId || !coachId || (sesi !== 1 && sesi !== 4 && sesi !== 8)) {
    return Response.json({ error: "Pilih kolam, coach, dan paket dulu." }, { status: 400 });
  }
  const [pool, coach] = await Promise.all([
    prisma.pool.findFirst({
      where: { id: poolId, isActive: true },
      select: { id: true, pricePack4: true, pricePack8: true, serviceFeeBps: true },
    }),
    prisma.user.findFirst({
      where: { id: coachId, role: "COACH", isActive: true, poolAffiliations: { some: { poolId } } },
      select: { name: true, coachProfile: { select: { isActive: true, pricePack4: true, pricePack8: true } } },
    }),
  ]);
  if (!pool) {
    return Response.json({ error: "Kolam tidak ditemukan atau sedang tidak aktif." }, { status: 400 });
  }
  if (!coach?.coachProfile?.isActive) {
    return Response.json({ error: "Coach ini tidak mengajar di kolam ini atau sedang tidak aktif." }, { status: 400 });
  }
  const quote = sesi === 1 ? trialQuote(pool, coach.coachProfile) : packQuote(pool, coach.coachProfile, sesi);
  if (!quote) {
    return Response.json({ error: "Harga paket ini belum dipasang kolam atau coach." }, { status: 400 });
  }
  const item = {
    poolId: pool.id,
    templateId: null,
    name: `${quote.isTrial ? "Sesi coba" : `Paket ${quote.totalSesi} sesi`} · ${coach.name}`,
    totalSesi: quote.totalSesi,
    jatahCancel: quote.jatahCancel,
    price: quote.total,
    isSingleSession: false,
    isTrial: quote.isTrial,
  };

  // Form katalog sekarang nolak harga < Rp1, tapi data lama bisa aja
  // udah terlanjur Rp0 -- jangan sampai jadi paket gratis lewat checkout.
  if (!Number.isInteger(item.price) || item.price < 1) {
    return Response.json({ error: "Harga paket ini belum valid. Hubungi admin." }, { status: 400 });
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
        coachId,
        totalSesi: item.totalSesi,
        isTrial: item.isTrial,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });
    if (recentDuplicate) return null;
    // Trial 1x per peserta, dicek di dalam kunci yang sama supaya klik beli
    // barengan tidak menghasilkan dua trial.
    if (item.isTrial && (await tx.package.count({ where: { dependentId, ...trialBlockingPackageWhere() } })) > 0) {
      return "TRIAL_USED" as const;
    }
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
        isTrial: item.isTrial,
        coachId,
        poolPrice: quote.poolPrice,
        coachPrice: quote.coachPrice,
        serviceFee: quote.serviceFee,
        durationDays: quote.durationDays,
        status: "PENDING_PAYMENT",
      },
    });
  });
  if (pkg === "TRIAL_USED") {
    return Response.json(
      { error: "Paket trial hanya untuk peserta yang belum pernah punya paket, satu kali per peserta." },
      { status: 403 }
    );
  }
  if (!pkg) {
    return Response.json(
      { error: "Pembayaran untuk paket ini baru saja dibuat. Tunggu 1 menit sebelum coba lagi." },
      { status: 409 }
    );
  }

  const orderId = `PKG-${pkg.id}-${Date.now()}`;
  const origin = new URL(request.url).origin;

  // Payment dicatat SEBELUM transaksi Midtrans dibuat -- kebalikannya
  // (Snap dulu baru Payment) bisa ninggalin transaksi Midtrans hidup
  // tanpa Payment di DB kalau simpan gagal: member tetep bisa bayar, uang
  // masuk, webhook gak nemu Payment, paket gak pernah aktif.
  await prisma.payment.create({
    data: {
      packageId: pkg.id,
      midtransOrderId: orderId,
      amount: item.price,
      status: "PENDING",
    },
  });

  try {
    const transaction = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: item.price },
      // Kartu kredit tidak ditawarkan (Hadi 2 Okt): biaya Midtrans ditanggung
      // SPH dan tidak boleh dibebankan ke pembeli (aturan BI), biaya kartu
      // ~2,9% hampir menghabiskan biaya layanan.
      enabled_payments: [...NON_CARD_PAYMENTS],
      customer_details: {
        first_name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
      },
      item_details: [
        {
          id: `${item.poolId}-${coachId}-${item.totalSesi}`,
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

    // Disimpan untuk tombol "Lanjut bayar" (member menutup halaman Midtrans
    // sebelum selesai). Gagal simpan tidak boleh menggagalkan checkout --
    // transaksinya sudah ada dan bisa dibayar lewat link yang dikirim sekarang.
    await prisma.payment
      .update({ where: { midtransOrderId: orderId }, data: { snapRedirectUrl: transaction.redirect_url } })
      .catch((e) => console.error("simpan snapRedirectUrl gagal", e));

    return Response.json({ redirectUrl: transaction.redirect_url });
  } catch (err) {
    // Snap gagal = belum ada transaksi yang bisa dibayar, aman dibersihin.
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { packageId: pkg.id } }),
      prisma.package.delete({ where: { id: pkg.id } }),
    ]);
    // Detail error Midtrans cuma ke log server, gak dikirim ke browser.
    console.error("snap.createTransaction failed", err);
    return Response.json(
      { error: "Gagal membuat transaksi pembayaran. Coba lagi beberapa saat lagi." },
      { status: 502 }
    );
  }
}
