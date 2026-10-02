import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { platformServerKey } from "@/lib/midtrans";
import type { Prisma } from "@/generated/prisma/client";
import { sendPushToUser } from "@/lib/push";
import { completeCoachChange, notifyCoachChangeResult } from "@/lib/coach-change";
import { creditMember, reclaimRefundedBalance, refundMemberBalanceOnce } from "@/lib/member-wallet";
import { notifyAdmins } from "@/lib/notify";
import { metaCapiEnabled, sendMetaEvent, type MetaTracking } from "@/lib/meta-capi";

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
  // Perbandingan waktu-konstan: `===` berhenti di karakter pertama yang
  // beda, jadi lama prosesnya bocorin berapa karakter awal yang udah benar.
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureKey);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
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
    fraud_status: fraudStatus,
  } = body as {
    order_id?: string;
    status_code?: string;
    gross_amount?: string;
    signature_key?: string;
    transaction_status?: string;
    fraud_status?: string;
  };

  if (!orderId || !signatureKey) {
    return Response.json({ ok: true, error: "Payload tidak lengkap" });
  }

  if (!verifySignature(orderId, statusCode ?? "", grossAmount ?? "", signatureKey)) {
    return Response.json({ ok: true, error: "Signature tidak valid" });
  }

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
    include: { package: true },
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
  //
  // Status lain (pending/expire yang telat, refund, dll) buat payment yang
  // udah SUCCESS juga gak boleh ngubah apa-apa -- refund belum ditangani
  // otomatis, diproses manual (lihat /kebijakan-pengembalian).
  if (payment.status === "SUCCESS") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { rawWebhookPayload: body as Prisma.InputJsonValue },
    });
    return Response.json({ ok: true });
  }

  let paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" = "PENDING";
  let packageStatus: "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | null = null;

  // `capture` (kartu) belum tentu aman: Midtrans FDS bisa ngasih
  // fraud_status "challenge" (perlu review manual) atau "deny". Cuma
  // "accept" yang boleh ngaktifin paket. Challenge ditahan PENDING --
  // setelah diputuskan di dashboard Midtrans, notifikasi berikutnya
  // (settlement/deny) yang nentuin. fraud_status kosong juga ditahan
  // (gagal aman: paket telat aktif lebih baik dari aktif tanpa dibayar).
  if (transactionStatus === "capture" && fraudStatus === "deny") {
    paymentStatus = "FAILED";
    packageStatus = "EXPIRED";
  } else if (transactionStatus === "capture" && fraudStatus !== "accept") {
    paymentStatus = "PENDING";
  } else if (transactionStatus === "capture" || transactionStatus === "settlement") {
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

  // Lapisan cadangan: jumlah yang dibayar harus sama dengan tagihan kita.
  // Tanda tangan Midtrans sudah mengunci gross_amount, jadi beda jumlah
  // berarti ada salah di sisi kita (harga berubah di tengah checkout, dsb) --
  // paket JANGAN diaktifkan otomatis; biarkan PENDING untuk dicek admin.
  if (paymentStatus === "SUCCESS" && Math.round(Number(grossAmount)) !== payment.amount) {
    console.error(`[webhook] jumlah tidak cocok order ${orderId}: dibayar ${grossAmount}, tagihan ${payment.amount}`);
    paymentStatus = "PENDING";
    packageStatus = null;
  }

  // Paket menyimpan masa berlakunya sendiri (model harga-dari-coach); 60 hari
  // hanya cadangan untuk data lama tanpa nilai ini.
  const durationDays = payment.package.durationDays ?? 60;
  const now = new Date();
  const expiredDate = new Date(now);
  expiredDate.setDate(expiredDate.getDate() + durationDays);

  let activated = false;
  // Tambahan bayar ganti coach: status paket tidak disentuh sama sekali.
  const coachChangeId = payment.coachChangeRequestId;
  if (coachChangeId) packageStatus = null;
  let coachChangeResult: "completed" | "refunded" | "expired" | null = null;
  let saldoShortage = 0;

  await prisma.$transaction(async (tx) => {
    // Payment yang udah SUCCESS gak boleh turun status lagi -- notif
    // "pending"/"expire" yang telat nyampe (retry Midtrans, urutan gak
    // dijamin) sebelumnya nge-balikin payment jadi PENDING & paket yang
    // udah dibayar jadi EXPIRED; efek lanjutannya markAttendance gak
    // ngredit wallet (butuh Payment SUCCESS). Dicek atomic di WHERE, bukan
    // cuma dari `payment.status` yang dibaca di atas, biar 2 notif yang
    // nyampe barengan juga aman. Kebukti di tes race lokal 2026-09-17.
    const claim = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "SUCCESS" } },
      data: {
        status: paymentStatus,
        rawWebhookPayload: body as Prisma.InputJsonValue,
        // Waktu uang benar-benar masuk (dasar "uang masuk hari ini/bulan ini").
        ...(paymentStatus === "SUCCESS" ? { paidAt: now } : {}),
      },
    });
    if (claim.count === 0) return;

    if (packageStatus) {
      await tx.package.update({
        where: { id: payment.packageId },
        data: {
          status: packageStatus,
          ...(packageStatus === "ACTIVE" ? { startDate: now, expiredDate } : {}),
        },
      });
    }

    // Gak ada kredit wallet di sini -- paket lintas-kolam (revisi
    // 2026-09-12) artinya kolam mana yang dikredit baru ketauan pas
    // tiap sesi BENERAN dipake (lihat src/lib/wallet.ts, dipanggil dari
    // markAttendance). Payment sukses cuma bikin Package aktif.
    activated = packageStatus === "ACTIVE";

    // Saldo member yang terpakai dikembalikan kalau pembayaran gagal/kedaluwarsa.
    const failed = paymentStatus === "FAILED" || paymentStatus === "EXPIRED";
    if (!coachChangeId && failed) {
      await refundMemberBalanceOnce(tx, payment.package.memberId, payment.package.saldoUsed, { packageId: payment.packageId });
    }
    // Lunas setelah sempat dianggap gagal (saldo sudah dikembalikan): saldo dipakai lagi.
    if (!coachChangeId && paymentStatus === "SUCCESS") {
      saldoShortage = await reclaimRefundedBalance(tx, payment.package.memberId, payment.package.saldoUsed, { packageId: payment.packageId });
    }
    if (coachChangeId) {
      const req = await tx.coachChangeRequest.findUniqueOrThrow({ where: { id: coachChangeId } });
      if (paymentStatus === "SUCCESS") {
        saldoShortage = await reclaimRefundedBalance(tx, req.memberId, req.saldoUsed, { packageId: req.packageId, coachChangeRequestId: req.id });
        const done = await completeCoachChange(tx, coachChangeId, now);
        if (done.ok) coachChangeResult = "completed";
        else {
          // Uang sudah masuk tapi ganti coach tidak bisa diselesaikan (coach
          // baru nonaktif, dst): seluruh tambahan bayar masuk saldo member.
          // Saldo yang tidak berhasil ditarik lagi (sudah terpakai member) tidak
          // ikut dikreditkan: member hanya menerima kembali yang benar-benar ia bayar.
          await creditMember(tx, req.memberId, payment.amount + req.saldoUsed - saldoShortage, "PURCHASE_REFUND", {
            packageId: req.packageId,
            coachChangeRequestId: req.id,
            note: "Ganti coach gagal diselesaikan, tambahan bayar dikembalikan ke saldo",
          });
          saldoShortage = 0;
          await tx.coachChangeRequest.updateMany({
            where: { id: req.id, status: { in: ["PENDING", "AWAITING_PAYMENT", "EXPIRED"] } },
            data: { status: "EXPIRED", adminNote: done.error },
          });
          coachChangeResult = "refunded";
        }
      } else if (failed) {
        await tx.coachChangeRequest.updateMany({ where: { id: req.id, status: "AWAITING_PAYMENT" }, data: { status: "EXPIRED" } });
        await refundMemberBalanceOnce(tx, req.memberId, req.saldoUsed, { packageId: req.packageId, coachChangeRequestId: req.id });
        coachChangeResult = "expired";
      }
    }
  });

  // Setelah commit & cuma untuk transisi pertama ke SUCCESS (notifikasi
  // duplikat sudah keluar di atas). Gagal kirim push tidak boleh
  // menggagalkan webhook -- Midtrans akan mengirim ulang.
  if (activated) {
    await sendPushToUser(payment.package.memberId, {
      title: "Pembayaran berhasil",
      body: `${payment.package.name} sudah aktif. Yuk booking jadwal.`,
      url: "/member/booking",
    }).catch(() => {});
    // Pelacak iklan Meta (Hadi 2 Okt, 5A): sekali, di transisi pertama ke
    // lunas. Nilai = total harga paket (tunai + saldo yang dipakai).
    if (metaCapiEnabled()) {
      const member = await prisma.user.findUnique({ where: { id: payment.package.memberId }, select: { phone: true, email: true } }).catch(() => null);
      await sendMetaEvent({
        eventName: "Purchase",
        eventId: orderId,
        user: { userId: payment.package.memberId, phone: member?.phone, email: member?.email },
        tracking: (payment.metaTracking ?? {}) as MetaTracking,
        sourceUrl: `${new URL(request.url).origin}/pembayaran/sukses`,
        value: payment.amount + payment.package.saldoUsed,
      }).catch(() => {});
    }
  }

  if (saldoShortage > 0) {
    console.error(`[webhook] ${orderId} lunas setelah saldo dikembalikan; saldo member kurang ${saldoShortage}`);
    await notifyAdmins("Cek saldo member", `Pembayaran ${orderId} lunas belakangan; saldo member kurang ${saldoShortage} untuk ditarik kembali`, "/admin/pembayaran").catch(() => {});
  }
  if (coachChangeId && coachChangeResult) {
    await notifyCoachChangeResult(coachChangeId, coachChangeResult).catch(() => {});
  }

  return Response.json({ ok: true });
}
