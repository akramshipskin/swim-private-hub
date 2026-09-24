-- AlterTable
ALTER TABLE "User" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN "anonymizedAt" TIMESTAMP(3);
