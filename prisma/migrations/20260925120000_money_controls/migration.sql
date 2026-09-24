-- Waktu pembayaran benar-benar sukses (dasar laporan "uang masuk").
ALTER TABLE "Payment" ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "snapRedirectUrl" TEXT;
-- Data lama: perkiraan terbaik = updatedAt (bisa bergeser kalau Midtrans
-- pernah mengirim notifikasi duplikat; hanya untuk baris sebelum migrasi ini).
UPDATE "Payment" SET "paidAt" = "updatedAt" WHERE "status" = 'SUCCESS' AND "paidAt" IS NULL;
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");

-- Bukti transfer manual + admin yang memproses pencairan.
ALTER TABLE "WithdrawalRequest" ADD COLUMN "transferReference" TEXT,
ADD COLUMN "processedById" TEXT;

-- Pagar integritas saldo (sweep keamanan 25 Sep). NOT VALID = hanya berlaku
-- untuk baris baru/diubah, jadi migrasi tidak gagal karena data lama; cek data
-- lama terpisah, lalu jalankan VALIDATE CONSTRAINT (lihat catatan deploy).
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_owner_matches_type" CHECK (
  ("type" = 'SESSION_REVENUE' AND "poolId" IS NOT NULL AND "coachProfileId" IS NULL)
  OR ("type" = 'SESSION_PAYOUT' AND "coachProfileId" IS NOT NULL AND "poolId" IS NULL)
  OR ("type" = 'WITHDRAWAL' AND (("poolId" IS NULL) <> ("coachProfileId" IS NULL)))
  OR ("type" IN ('PLATFORM_REVENUE', 'PLATFORM_TAX') AND "poolId" IS NULL AND "coachProfileId" IS NULL)
) NOT VALID;

ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_exactly_one_owner" CHECK (
  ("poolId" IS NULL) <> ("coachProfileId" IS NULL)
) NOT VALID;
