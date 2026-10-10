-- CreateEnum
CREATE TYPE "CoachReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterEnum
ALTER TYPE "AffiliateCommissionStatus" ADD VALUE 'VOID';

-- AlterEnum
ALTER TYPE "MemberWalletType" ADD VALUE 'ADMIN_REFUND';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reminderEveningAt" TIMESTAMP(3),
ADD COLUMN     "reminderMorningAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "expiryNotice14At" TIMESTAMP(3),
ADD COLUMN     "expiryNotice3At" TIMESTAMP(3),
ADD COLUMN     "refundCash" INTEGER,
ADD COLUMN     "refundNote" TEXT,
ADD COLUMN     "refundReference" TEXT,
ADD COLUMN     "refundSaldo" INTEGER,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "refundedById" TEXT;

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "deactivatedReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "CoachReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "bookingId" TEXT,
    "message" TEXT NOT NULL,
    "attachmentPath" TEXT,
    "status" "CoachReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachReport_status_createdAt_idx" ON "CoachReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CoachReport_coachId_createdAt_idx" ON "CoachReport"("coachId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_bookingId_idx" ON "WalletTransaction"("bookingId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_createdAt_idx" ON "WalletTransaction"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachReport" ADD CONSTRAINT "CoachReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
