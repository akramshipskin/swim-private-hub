-- Bagi hasil bawaan kolam baru: komisi SPH 10%, coach 40% (sisanya kolam 50%).
-- Hanya mengubah bawaan untuk kolam yang dibuat setelah ini; persentase kolam
-- yang sudah ada tidak berubah.
ALTER TABLE "Pool" ALTER COLUMN "commissionPercent" SET DEFAULT 10;
ALTER TABLE "Pool" ALTER COLUMN "coachSharePercent" SET DEFAULT 40;
