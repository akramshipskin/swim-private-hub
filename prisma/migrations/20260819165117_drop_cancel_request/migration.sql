-- DropForeignKey
ALTER TABLE "CancelRequest" DROP CONSTRAINT IF EXISTS "CancelRequest_bookingId_fkey";
ALTER TABLE "CancelRequest" DROP CONSTRAINT IF EXISTS "CancelRequest_memberId_fkey";
ALTER TABLE "CancelRequest" DROP CONSTRAINT IF EXISTS "CancelRequest_packageId_fkey";

-- DropTable
DROP TABLE IF EXISTS "CancelRequest";

-- DropEnum
DROP TYPE IF EXISTS "CancelRequestStatus";
