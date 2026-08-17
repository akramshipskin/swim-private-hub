-- CreateEnum
CREATE TYPE "CancelRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "jatahCancel" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "PackageTemplate" ADD COLUMN     "durationDays" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "jatahCancel" INTEGER NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "CancelRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "status" "CancelRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "CancelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CancelRequest_bookingId_key" ON "CancelRequest"("bookingId");

-- CreateIndex
CREATE INDEX "CancelRequest_memberId_idx" ON "CancelRequest"("memberId");

-- CreateIndex
CREATE INDEX "CancelRequest_status_idx" ON "CancelRequest"("status");

-- AddForeignKey
ALTER TABLE "CancelRequest" ADD CONSTRAINT "CancelRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelRequest" ADD CONSTRAINT "CancelRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelRequest" ADD CONSTRAINT "CancelRequest_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
