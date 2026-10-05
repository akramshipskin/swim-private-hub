import { PAYMENT_WINDOW_HOURS } from "@/lib/policy";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { COACH_CHANGE_PAY_WINDOW_MS, completeCoachChange, notifyCoachChangeResult } from "@/lib/coach-change";
import { refundMemberBalanceOnce, spendMemberBalance } from "@/lib/member-wallet";
import { NON_CARD_PAYMENTS } from "@/lib/midtrans-methods";
import { DELETION_PENDING_COACH_CHANGE_ERROR } from "@/lib/coach-change-rules";

// Tambah bayar ganti coach ke coach lebih mahal (Hadi 2 Okt): saldo member
// dipakai dulu, sisanya lewat Midtrans; ganti coach berlaku setelah lunas.
// Tidak dibayar dalam 24 jam sejak disetujui = batal.
class CoachChangeError extends Error {}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "MEMBER") return Response.json({ error: "Kamu belum masuk atau tidak punya akses ke fitur ini. Silakan masuk lagi." }, { status: 401 });
  if (session.user.mustChangePassword) return Response.json({ error: "Ganti password sementaramu dulu sebelum melanjutkan." }, { status: 403 });

  let body: { requestId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  const requestId = body.requestId ?? "";
  const origin = new URL(request.url).origin;
  const memberId = session.user.id;

  const prep = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT 1 FROM "CoachChangeRequest" WHERE id = ${requestId} FOR UPDATE`;
    const req = await tx.coachChangeRequest.findFirst({
      where: { id: requestId, memberId },
      include: { payments: { where: { status: "PENDING" }, select: { snapRedirectUrl: true } }, toCoach: { select: { name: true } } },
    });
    if (!req || req.status !== "AWAITING_PAYMENT" || req.amount == null || req.amount <= 0 || !req.decidedAt) {
      return { error: "Pengajuan ini tidak menunggu pembayaran." } as const;
    }
    // Sudah ada pembayaran yang berjalan: arahkan ke situ, jangan bikin dobel.
    // Dicek SEBELUM pintu hapus akun: uang yang sudah di jalan tidak boleh
    // terkunci dari layar bayarnya (webhook tetap menyelesaikannya bila lunas).
    if (req.payments[0]) return { redirectUrl: req.payments[0].snapRedirectUrl } as const;
    // Pintu hapus akun untuk pembayaran BARU (memakai saldo / membuat transaksi).
    // Baris akun dikunci FOR UPDATE (sama dengan kunci spendMemberBalance di bawah, tanpa
    // kenaikan kunci; urutan sama dengan completeCoachChange: pengajuan, akun, paket) supaya pengajuan hapus akun yang bersamaan menunggu dan bacaan ini segar.
    const [owner] = await tx.$queryRaw<{ deletionRequestedAt: Date | null }[]>`SELECT "deletionRequestedAt" FROM "User" WHERE id = ${memberId} FOR UPDATE`;
    if (owner?.deletionRequestedAt) return { error: DELETION_PENDING_COACH_CHANGE_ERROR } as const;
    if (Date.now() - req.decidedAt.getTime() > COACH_CHANGE_PAY_WINDOW_MS) {
      await tx.coachChangeRequest.update({ where: { id: req.id }, data: { status: "EXPIRED" } });
      return { error: "Batas 24 jam untuk tambah bayar sudah lewat, jadi pengajuan dibatalkan. Ajukan ulang bila masih ingin ganti coach." } as const;
    }
    const used = await spendMemberBalance(tx, memberId, req.amount, { packageId: req.packageId, coachChangeRequestId: req.id });
    await tx.coachChangeRequest.update({ where: { id: req.id }, data: { saldoUsed: used } });
    const cash = req.amount - used;
    if (cash === 0) {
      const done = await completeCoachChange(tx, req.id);
      // Gagal = batalkan seluruh transaksi (saldo tidak jadi terpakai).
      if (!done.ok) throw new CoachChangeError(done.error);
      return { completed: true } as const;
    }
    const orderId = `CHG-${req.id}-${Date.now()}`;
    await tx.payment.create({
      data: { packageId: req.packageId, coachChangeRequestId: req.id, midtransOrderId: orderId, amount: cash, status: "PENDING" },
    });
    return { orderId, cash, saldoUsed: used, packageId: req.packageId, coachName: req.toCoach.name } as const;
  }).catch((err) => {
    if (err instanceof CoachChangeError) return { error: err.message } as const;
    throw err;
  });

  if ("error" in prep) return Response.json({ error: prep.error }, { status: 409 });
  if ("redirectUrl" in prep) return Response.json({ redirectUrl: prep.redirectUrl ?? `${origin}/member/paket` });
  if ("completed" in prep) {
    await notifyCoachChangeResult(requestId, "completed").catch(() => {});
    return Response.json({ redirectUrl: `${origin}/member/paket` });
  }

  try {
    const transaction = await snap.createTransaction({
      transaction_details: { order_id: prep.orderId, gross_amount: prep.cash },
      enabled_payments: [...NON_CARD_PAYMENTS],
      // Batas bayar sama dengan layar & pembersih saldo (PAYMENT_WINDOW_HOURS).
      expiry: { unit: "hours", duration: PAYMENT_WINDOW_HOURS },
      customer_details: { first_name: session.user.name ?? undefined, email: session.user.email ?? undefined },
      item_details: [{ id: `ganti-coach-${requestId}`, price: prep.cash, quantity: 1, name: `Tambah bayar ganti coach · ${prep.coachName}`.slice(0, 50) }],
      callbacks: { finish: `${origin}/member/paket`, unfinish: `${origin}/member/paket`, error: `${origin}/member/paket` },
    });
    await prisma.payment
      .update({ where: { midtransOrderId: prep.orderId }, data: { snapRedirectUrl: transaction.redirect_url } })
      .catch((e) => console.error("simpan snapRedirectUrl gagal", e));
    return Response.json({ redirectUrl: transaction.redirect_url });
  } catch (err) {
    // Midtrans gagal: belum ada yang bisa dibayar. Saldo dikembalikan,
    // pengajuan tetap menunggu pembayaran (masih bisa dicoba lagi).
    await prisma.$transaction(async (tx) => {
      await refundMemberBalanceOnce(tx, memberId, prep.saldoUsed, { packageId: prep.packageId, coachChangeRequestId: requestId });
      await tx.payment.deleteMany({ where: { midtransOrderId: prep.orderId } });
      await tx.coachChangeRequest.update({ where: { id: requestId }, data: { saldoUsed: 0 } });
    });
    console.error("snap.createTransaction (ganti coach) failed", err);
    return Response.json({ error: "Gagal membuat transaksi pembayaran. Coba lagi beberapa saat lagi." }, { status: 502 });
  }
}
