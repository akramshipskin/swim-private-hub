-- CreateEnum
CREATE TYPE "MarkedBy" AS ENUM ('COACH', 'ADMIN');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "attended" BOOLEAN,
ADD COLUMN     "attendedAt" TIMESTAMP(3),
ADD COLUMN     "attendedBy" "MarkedBy";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

