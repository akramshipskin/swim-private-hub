-- Koreksi saldo oleh admin: alasan, admin pencatat, dan kunci anti-dobel.
-- Hanya menambah kolom kosong (nullable); baris lama tidak berubah.
ALTER TABLE "WalletTransaction" ADD COLUMN "note" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");
