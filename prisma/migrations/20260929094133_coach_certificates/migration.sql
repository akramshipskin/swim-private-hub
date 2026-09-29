-- CreateTable
CREATE TABLE "CoachCertificate" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachCertificate_coachProfileId_status_idx" ON "CoachCertificate"("coachProfileId", "status");

-- CreateIndex
CREATE INDEX "CoachCertificate_status_createdAt_idx" ON "CoachCertificate"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachCertificate" ADD CONSTRAINT "CoachCertificate_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pindahkan sertifikat lama (1 per coach, kolom CoachProfile.certificateUrl/
-- certificateStatus) ke tabel baru. Status NONE tidak dipindah. Baris tanpa
-- file (akun demo yang disetujui tanpa unggahan) tetap dipindah supaya badge
-- "Bersertifikat" yang sudah tampil tidak hilang.
-- id memakai prefix "legacy_" + id profil supaya unik & bisa dilacak.
-- Waktu ditulis eksplisit dalam UTC (Prisma membaca TIMESTAMP tanpa zona
-- sebagai UTC; CURRENT_TIMESTAMP ikut zona sesi DB).
INSERT INTO "CoachCertificate" ("id", "coachProfileId", "name", "filePath", "status", "reviewedAt", "createdAt")
SELECT
    'legacy_' || cp."id",
    cp."id",
    COALESCE(NULLIF(TRIM(cp."certificationNote"), ''), 'Sertifikat'),
    cp."certificateUrl",
    cp."certificateStatus",
    CASE WHEN cp."certificateStatus" IN ('APPROVED', 'REJECTED') THEN (now() AT TIME ZONE 'UTC') ELSE NULL END,
    (now() AT TIME ZONE 'UTC')
FROM "CoachProfile" cp
WHERE cp."certificateStatus" <> 'NONE';
