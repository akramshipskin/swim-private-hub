-- Aktifkan penuh 2 pagar saldo dari 20260925120000_money_controls (dipasang
-- NOT VALID). Audit produksi Hadi 24 Sep 2026 (scripts/audit-prod-data.mts):
-- 0 baris melanggar. VALIDATE memeriksa SEMUA baris lama; kalau ada satu saja
-- yang melanggar, migrasi GAGAL dengan pesan menyebut nama constraint-nya dan
-- tidak ada yang berubah (tidak menghapus/mengubah data).
ALTER TABLE "WalletTransaction" VALIDATE CONSTRAINT "WalletTransaction_owner_matches_type";
ALTER TABLE "WithdrawalRequest" VALIDATE CONSTRAINT "WithdrawalRequest_exactly_one_owner";
