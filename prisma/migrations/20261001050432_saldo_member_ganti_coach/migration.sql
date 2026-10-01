-- CreateEnum
CREATE TYPE "MemberWalletType" AS ENUM ('COACH_CHANGE_CREDIT', 'PURCHASE', 'PURCHASE_REFUND');

-- CreateEnum
CREATE TYPE "CoachChangeStatus" AS ENUM ('PENDING', 'AWAITING_PAYMENT', 'COMPLETED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "saldoUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "coachChangeRequestId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "memberBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "MemberWalletTransaction" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "MemberWalletType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "packageId" TEXT,
    "coachChangeRequestId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberWalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachChangeRequest" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fromCoachId" TEXT NOT NULL,
    "toCoachId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "CoachChangeStatus" NOT NULL DEFAULT 'PENDING',
    "sessions" INTEGER,
    "amount" INTEGER,
    "newCoachPrice" INTEGER,
    "oldCoachPrice" INTEGER,
    "oldServiceFee" INTEGER,
    "saldoUsed" INTEGER NOT NULL DEFAULT 0,
    "adminNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PphRemittance" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PphRemittance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberWalletTransaction_memberId_createdAt_idx" ON "MemberWalletTransaction"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "MemberWalletTransaction_packageId_idx" ON "MemberWalletTransaction"("packageId");

-- CreateIndex
CREATE INDEX "CoachChangeRequest_status_createdAt_idx" ON "CoachChangeRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CoachChangeRequest_packageId_idx" ON "CoachChangeRequest"("packageId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_coachChangeRequestId_fkey" FOREIGN KEY ("coachChangeRequestId") REFERENCES "CoachChangeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberWalletTransaction" ADD CONSTRAINT "MemberWalletTransaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachChangeRequest" ADD CONSTRAINT "CoachChangeRequest_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachChangeRequest" ADD CONSTRAINT "CoachChangeRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachChangeRequest" ADD CONSTRAINT "CoachChangeRequest_fromCoachId_fkey" FOREIGN KEY ("fromCoachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachChangeRequest" ADD CONSTRAINT "CoachChangeRequest_toCoachId_fkey" FOREIGN KEY ("toCoachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Satu pengajuan terbuka per paket (klik ganda / dua tab tidak bikin dua pengajuan).
CREATE UNIQUE INDEX "CoachChangeRequest_one_open_per_package" ON "CoachChangeRequest"("packageId") WHERE "status" IN ('PENDING', 'AWAITING_PAYMENT');

-- Saldo member tidak boleh minus (lapis kedua selain cek di kode).
ALTER TABLE "User" ADD CONSTRAINT "User_memberBalance_nonnegative" CHECK ("memberBalance" >= 0);
