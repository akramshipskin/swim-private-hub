-- CreateEnum
CREATE TYPE "AffiliateCommissionStatus" AS ENUM ('WAITING', 'PENDING', 'RELEASED');

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'AFFILIATE_COMMISSION';

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PackageTemplate" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralCodeId" TEXT;

-- CreateTable
CREATE TABLE "AffiliateCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coachProfileId" TEXT,
    "poolId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "coachProfileId" TEXT,
    "poolId" TEXT,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "AffiliateCommissionStatus" NOT NULL DEFAULT 'WAITING',
    "bookingId" TEXT,
    "releaseAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_code_key" ON "AffiliateCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_coachProfileId_key" ON "AffiliateCode"("coachProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCode_poolId_key" ON "AffiliateCode"("poolId");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateCommission_memberId_key" ON "AffiliateCommission"("memberId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_status_releaseAt_idx" ON "AffiliateCommission"("status", "releaseAt");

-- CreateIndex
CREATE INDEX "AffiliateCommission_coachProfileId_idx" ON "AffiliateCommission"("coachProfileId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_poolId_idx" ON "AffiliateCommission"("poolId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "AffiliateCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCode" ADD CONSTRAINT "AffiliateCode_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCode" ADD CONSTRAINT "AffiliateCode_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tepat 1 pemilik per kode afiliasi.
ALTER TABLE "AffiliateCode" ADD CONSTRAINT "AffiliateCode_exactly_one_owner" CHECK (
  ("coachProfileId" IS NULL) <> ("poolId" IS NULL)
);
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_exactly_one_owner" CHECK (
  ("coachProfileId" IS NULL) <> ("poolId" IS NULL)
);

-- Aturan pemilik baris ledger, ditambah AFFILIATE_COMMISSION (tepat 1 dari
-- coach/kolam). Constraint lama dibuang lalu dibuat ulang lengkap.
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_owner_matches_type";
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_owner_matches_type" CHECK (
  ("type" = 'SESSION_REVENUE' AND "poolId" IS NOT NULL AND "coachProfileId" IS NULL)
  OR ("type" = 'SESSION_PAYOUT' AND "coachProfileId" IS NOT NULL AND "poolId" IS NULL)
  OR ("type" IN ('WITHDRAWAL', 'AFFILIATE_COMMISSION') AND (("poolId" IS NULL) <> ("coachProfileId" IS NULL)))
  OR ("type" IN ('PLATFORM_REVENUE', 'PLATFORM_TAX') AND "poolId" IS NULL AND "coachProfileId" IS NULL)
);
