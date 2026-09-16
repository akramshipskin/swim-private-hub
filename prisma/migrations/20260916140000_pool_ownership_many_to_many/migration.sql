-- CreateTable
CREATE TABLE "PoolOwnership" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoolOwnership_pkey" PRIMARY KEY ("id")
);

-- Backfill dari Pool.ownerUserId SEBELUM kolomnya didrop -- kolam yang
-- udah ada owner-nya (self-registration lewat /daftar-kolam) gak boleh
-- kehilangan kepemilikan pas migrasi ke skema many-to-many.
INSERT INTO "PoolOwnership" ("id", "poolId", "ownerId", "createdAt")
SELECT gen_random_uuid()::text, "id", "ownerUserId", CURRENT_TIMESTAMP
FROM "Pool"
WHERE "ownerUserId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "PoolOwnership_ownerId_idx" ON "PoolOwnership"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PoolOwnership_poolId_ownerId_key" ON "PoolOwnership"("poolId", "ownerId");

-- AddForeignKey
ALTER TABLE "PoolOwnership" ADD CONSTRAINT "PoolOwnership_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoolOwnership" ADD CONSTRAINT "PoolOwnership_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Pool" DROP CONSTRAINT "Pool_ownerUserId_fkey";

-- AlterTable
ALTER TABLE "Pool" DROP COLUMN "ownerUserId";
