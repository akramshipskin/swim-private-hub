-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "consentNote" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_isPublished_sortOrder_idx" ON "Testimonial"("isPublished", "sortOrder");

-- Testimoni asli pertama (Hadi, 30 Sep 2026); yang bersangkutan mengizinkan.
-- Dikelola lewat admin > Testimoni setelah ini.
INSERT INTO "Testimonial" ("id", "name", "role", "quote", "consentNote", "isPublished", "sortOrder", "createdAt")
VALUES (
    'testimoni_ibu_clara',
    'Ibu Clara',
    'Orang tua Dinda',
    'Saya sangat terbantu dengan aplikasi Swim Private Hub, sangat memudahkan saya yang baru menjadi orang tua yang ingin mencari minat dan bakat anak pertama saya tanpa harus cari-cari ke setiap kolam di sini, cukup pakai aplikasi ini sangat membantu. Harganya pun masih masuk akal dilihat dari sertifikasi coach dan kolamnya pun proper.',
    'Yang bersangkutan menulis "saya mengizinkan"; diteruskan Hadi 30 Sep 2026',
    true,
    0,
    (now() AT TIME ZONE 'UTC')
);

-- Buang kolom sertifikat tunggal lama di CoachProfile: sudah dipindah ke
-- CoachCertificate (migrasi 20260929094133) dan tidak dibaca kode lagi.
-- Enum CertificateStatus tetap dipakai CoachCertificate.status.
ALTER TABLE "CoachProfile" DROP COLUMN "certificateUrl",
DROP COLUMN "certificateStatus";
