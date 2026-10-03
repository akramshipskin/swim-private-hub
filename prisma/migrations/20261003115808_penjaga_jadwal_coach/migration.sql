-- AlterTable
ALTER TABLE "CoachChangeRequest" ADD COLUMN     "free" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fromPoolId" TEXT,
ADD COLUMN     "oldPoolPrice" INTEGER;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "freeCoachChangeAt" TIMESTAMP(3),
ADD COLUMN     "noSlotSince" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CoachViolation" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "episodeStart" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachViolation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachViolation_coachId_createdAt_idx" ON "CoachViolation"("coachId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoachViolation_packageId_episodeStart_key" ON "CoachViolation"("packageId", "episodeStart");

-- AddForeignKey
ALTER TABLE "CoachViolation" ADD CONSTRAINT "CoachViolation_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachViolation" ADD CONSTRAINT "CoachViolation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
