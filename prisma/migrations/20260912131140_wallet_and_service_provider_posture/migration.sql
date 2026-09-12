/*
  Warnings:

  - You are about to drop the column `midtransClientKeyEnc` on the `Pool` table. All the data in the column will be lost.
  - You are about to drop the column `midtransIsProduction` on the `Pool` table. All the data in the column will be lost.
  - You are about to drop the column `midtransServerKeyEnc` on the `Pool` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('PACKAGE_SALE', 'SESSION_PAYOUT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'POOL_OWNER';

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "walletBalance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Pool" DROP COLUMN "midtransClientKeyEnc",
DROP COLUMN "midtransIsProduction",
DROP COLUMN "midtransServerKeyEnc",
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "coachSharePercent" INTEGER NOT NULL DEFAULT 55,
ADD COLUMN     "walletBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "poolId" TEXT,
    "coachProfileId" TEXT,
    "amount" INTEGER NOT NULL,
    "paymentId" TEXT,
    "bookingId" TEXT,
    "withdrawalRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "poolId" TEXT,
    "coachProfileId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "bankName" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "midtransReferenceId" TEXT,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletTransaction_poolId_idx" ON "WalletTransaction"("poolId");

-- CreateIndex
CREATE INDEX "WalletTransaction_coachProfileId_idx" ON "WalletTransaction"("coachProfileId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_poolId_idx" ON "WithdrawalRequest"("poolId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_coachProfileId_idx" ON "WithdrawalRequest"("coachProfileId");

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
