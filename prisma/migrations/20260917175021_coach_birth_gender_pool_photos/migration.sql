-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
