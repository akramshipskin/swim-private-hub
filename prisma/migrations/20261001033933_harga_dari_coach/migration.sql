-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'PPH_WITHHELD';

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "pphExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricePack4" INTEGER,
ADD COLUMN     "pricePack8" INTEGER;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "coachId" TEXT,
ADD COLUMN     "coachPrice" INTEGER,
ADD COLUMN     "durationDays" INTEGER,
ADD COLUMN     "poolPrice" INTEGER,
ADD COLUMN     "serviceFee" INTEGER;

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "pphExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricePack4" INTEGER,
ADD COLUMN     "pricePack8" INTEGER,
ADD COLUMN     "serviceFeeBps" INTEGER NOT NULL DEFAULT 650;

-- CreateIndex
CREATE INDEX "Package_coachId_idx" ON "Package"("coachId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Potongan PPh 0,5% dicatat per dompet kolam ATAU coach (tepat satu terisi).
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_owner_matches_type";
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_owner_matches_type" CHECK (
  ("type" = 'SESSION_REVENUE' AND "poolId" IS NOT NULL AND "coachProfileId" IS NULL)
  OR ("type" = 'SESSION_PAYOUT' AND "coachProfileId" IS NOT NULL AND "poolId" IS NULL)
  OR ("type" IN ('WITHDRAWAL', 'AFFILIATE_COMMISSION', 'PPH_WITHHELD') AND (("poolId" IS NULL) <> ("coachProfileId" IS NULL)))
  OR ("type" IN ('PLATFORM_REVENUE', 'PLATFORM_TAX') AND "poolId" IS NULL AND "coachProfileId" IS NULL)
);
