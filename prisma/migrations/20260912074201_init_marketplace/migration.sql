/*
  Warnings:

  - Added the required column `poolId` to the `Availability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poolId` to the `Package` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poolId` to the `PackageTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Availability_coachId_date_idx";

-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "poolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "poolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PackageTemplate" ADD COLUMN     "poolId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "contactPhone" TEXT,
    "ownerUserId" TEXT,
    "midtransServerKeyEnc" TEXT,
    "midtransClientKeyEnc" TEXT,
    "midtransIsProduction" BOOLEAN NOT NULL DEFAULT false,
    "commissionPercent" INTEGER NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoolAffiliation" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolAffiliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoolAffiliation_coachId_idx" ON "PoolAffiliation"("coachId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolAffiliation_poolId_coachId_key" ON "PoolAffiliation"("poolId", "coachId");

-- CreateIndex
CREATE INDEX "Availability_poolId_date_idx" ON "Availability"("poolId", "date");

-- CreateIndex
CREATE INDEX "Package_poolId_idx" ON "Package"("poolId");

-- CreateIndex
CREATE INDEX "PackageTemplate_poolId_idx" ON "PackageTemplate"("poolId");

-- AddForeignKey
ALTER TABLE "PackageTemplate" ADD CONSTRAINT "PackageTemplate_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAffiliation" ADD CONSTRAINT "PoolAffiliation_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolAffiliation" ADD CONSTRAINT "PoolAffiliation_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
