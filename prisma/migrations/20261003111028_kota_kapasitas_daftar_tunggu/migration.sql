-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "city" TEXT,
ADD COLUMN     "dailyCapacity" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT;

-- CreateTable
CREATE TABLE "CityWaitlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "CityWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CityWaitlist_city_notifiedAt_idx" ON "CityWaitlist"("city", "notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CityWaitlist_userId_city_key" ON "CityWaitlist"("userId", "city");

-- AddForeignKey
ALTER TABLE "CityWaitlist" ADD CONSTRAINT "CityWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
