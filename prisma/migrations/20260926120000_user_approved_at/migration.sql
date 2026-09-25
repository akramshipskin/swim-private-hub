-- Penanda "akun baru menunggu persetujuan" (keputusan Hadi 25 Sep).
-- Semua akun yang sudah ada dianggap pernah ditinjau (akun demo yang sengaja
-- dinonaktifkan tidak boleh muncul sebagai pendaftar baru). Hanya menambah
-- kolom + mengisinya; tidak menghapus/mengubah data lain.
ALTER TABLE "User" ADD COLUMN "approvedAt" TIMESTAMP(3);
UPDATE "User" SET "approvedAt" = "createdAt";
