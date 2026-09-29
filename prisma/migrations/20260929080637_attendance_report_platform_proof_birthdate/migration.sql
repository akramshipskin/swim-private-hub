-- CreateEnum
CREATE TYPE "AttendanceReportStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "Dependent" ADD COLUMN     "birthDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlatformWithdrawal" ADD COLUMN     "transferReference" TEXT;

-- CreateTable
CREATE TABLE "AttendanceReport" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "note" TEXT,
    "status" "AttendanceReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceReport_bookingId_key" ON "AttendanceReport"("bookingId");

-- CreateIndex
CREATE INDEX "AttendanceReport_status_createdAt_idx" ON "AttendanceReport"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AttendanceReport" ADD CONSTRAINT "AttendanceReport_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
