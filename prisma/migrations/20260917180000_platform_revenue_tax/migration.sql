-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'PLATFORM_REVENUE';
ALTER TYPE "WalletTransactionType" ADD VALUE 'PLATFORM_TAX';

-- CreateTable
CREATE TABLE "PlatformWithdrawal" (
    "id" TEXT NOT NULL,
    "revenueAmount" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlatformWithdrawal_pkey" PRIMARY KEY ("id")
);
