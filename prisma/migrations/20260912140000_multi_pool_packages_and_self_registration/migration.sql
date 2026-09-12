-- AlterEnum
BEGIN;
CREATE TYPE "WalletTransactionType_new" AS ENUM ('SESSION_REVENUE', 'SESSION_PAYOUT', 'WITHDRAWAL');
ALTER TABLE "WalletTransaction" ALTER COLUMN "type" TYPE "WalletTransactionType_new" USING ("type"::text::"WalletTransactionType_new");
ALTER TYPE "WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "public"."WalletTransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "certificationNote" TEXT,
ADD COLUMN     "hasCertification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "openTime" TEXT;

