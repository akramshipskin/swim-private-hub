import { prisma } from "@/lib/prisma";

export class WithdrawalError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const MIN_WITHDRAWAL = 50_000;

// Dipake dari Pool owner ATAU Coach -- exactly 1 dari poolId/coachProfileId
// keisi (dicek caller). Saldo langsung dipotong pas request dibuat (bukan
// pas admin approve) -- biar gak ada 2 request dobel makan saldo yang sama
// sebelum yang pertama diproses. Kalau ditolak (FAILED), saldo dibalikin
// (lihat markWithdrawalFailed).
async function createWithdrawalRequest({
  poolId,
  coachProfileId,
  amount,
  bankName,
  bankAccountNumber,
  bankAccountName,
}: {
  poolId?: string;
  coachProfileId?: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}) {
  if (amount < MIN_WITHDRAWAL) {
    throw new WithdrawalError(
      `Minimal pencairan Rp${MIN_WITHDRAWAL.toLocaleString("id-ID")}.`
    );
  }

  return prisma.$transaction(async (tx) => {
    if (poolId) {
      const claim = await tx.pool.updateMany({
        where: { id: poolId, walletBalance: { gte: amount } },
        data: { walletBalance: { decrement: amount } },
      });
      if (claim.count === 0) {
        throw new WithdrawalError("Saldo gak cukup.");
      }
    } else if (coachProfileId) {
      const claim = await tx.coachProfile.updateMany({
        where: { id: coachProfileId, walletBalance: { gte: amount } },
        data: { walletBalance: { decrement: amount } },
      });
      if (claim.count === 0) {
        throw new WithdrawalError("Saldo gak cukup.");
      }
    }

    const request = await tx.withdrawalRequest.create({
      data: {
        poolId,
        coachProfileId,
        amount,
        bankName,
        bankAccountNumber,
        bankAccountName,
      },
    });

    await tx.walletTransaction.create({
      data: {
        type: "WITHDRAWAL",
        poolId,
        coachProfileId,
        amount: -amount,
        withdrawalRequestId: request.id,
      },
    });

    return request;
  });
}

export async function requestPoolWithdrawal(poolId: string) {
  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: {
      walletBalance: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
    },
  });
  if (!pool.bankName || !pool.bankAccountNumber || !pool.bankAccountName) {
    throw new WithdrawalError("Isi rekening tujuan dulu sebelum cairin saldo.");
  }
  return createWithdrawalRequest({
    poolId,
    amount: pool.walletBalance,
    bankName: pool.bankName,
    bankAccountNumber: pool.bankAccountNumber,
    bankAccountName: pool.bankAccountName,
  });
}

export async function requestCoachWithdrawal(coachProfileId: string) {
  const coach = await prisma.coachProfile.findUniqueOrThrow({
    where: { id: coachProfileId },
    select: {
      walletBalance: true,
      bankName: true,
      bankAccountNumber: true,
      bankAccountName: true,
    },
  });
  if (!coach.bankName || !coach.bankAccountNumber || !coach.bankAccountName) {
    throw new WithdrawalError("Isi rekening tujuan dulu sebelum cairin saldo.");
  }
  return createWithdrawalRequest({
    coachProfileId,
    amount: coach.walletBalance,
    bankName: coach.bankName,
    bankAccountNumber: coach.bankAccountNumber,
    bankAccountName: coach.bankAccountName,
  });
}

// Dipanggil admin kalau pencairan GAGAL diproses (Iris nolak, atau admin
// batalin manual) -- saldo yang udah kepotong pas request dibuat WAJIB
// balik, jangan biarin ilang gitu aja.
//
// Conditional update (CAS) di WHERE status -- tanpa ini, double-klik
// tombol "Tolak"/gagal Iris dobel bisa manggil ini 2x buat request yang
// sama, jadi saldo dibalikin DUA KALI. Sama kelas bug kayak
// cancelBooking/markAttendance, guard di titik yang sama (conditional
// update), bukan cuma di caller.
export async function markWithdrawalFailed(withdrawalRequestId: string, reason: string) {
  await prisma.$transaction(async (tx) => {
    const claim = await tx.withdrawalRequest.updateMany({
      where: { id: withdrawalRequestId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "FAILED", failureReason: reason, processedAt: new Date() },
    });
    if (claim.count === 0) return;

    const req = await tx.withdrawalRequest.findUniqueOrThrow({
      where: { id: withdrawalRequestId },
    });

    if (req.poolId) {
      await tx.pool.update({
        where: { id: req.poolId },
        data: { walletBalance: { increment: req.amount } },
      });
    } else if (req.coachProfileId) {
      await tx.coachProfile.update({
        where: { id: req.coachProfileId },
        data: { walletBalance: { increment: req.amount } },
      });
    }

    await tx.walletTransaction.create({
      data: {
        type: "WITHDRAWAL",
        poolId: req.poolId,
        coachProfileId: req.coachProfileId,
        amount: req.amount,
        withdrawalRequestId: req.id,
      },
    });
  });
}

export async function markWithdrawalPaid(withdrawalRequestId: string, midtransReferenceId?: string) {
  await prisma.withdrawalRequest.update({
    where: { id: withdrawalRequestId },
    data: { status: "PAID", processedAt: new Date(), midtransReferenceId },
  });
}
