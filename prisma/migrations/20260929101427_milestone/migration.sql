-- CreateEnum
CREATE TYPE "MilestoneGroup" AS ENUM ('A', 'B', 'C', 'D');

-- CreateEnum
CREATE TYPE "MilestoneProposalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CoachProfile" ADD COLUMN     "signaturePath" TEXT;

-- AlterTable
ALTER TABLE "Dependent" ADD COLUMN     "milestoneGroup" "MilestoneGroup";

-- CreateTable
CREATE TABLE "MilestoneItem" (
    "id" TEXT NOT NULL,
    "group" "MilestoneGroup" NOT NULL,
    "level" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "text" TEXT NOT NULL,
    "dependentId" TEXT,
    "createdById" TEXT,
    "proposalStatus" "MilestoneProposalStatus" NOT NULL DEFAULT 'NONE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneAchievement" (
    "id" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "coachId" TEXT,
    "priorSkill" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneNote" (
    "id" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "focusItemId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneLevelCompletion" (
    "id" TEXT NOT NULL,
    "dependentId" TEXT NOT NULL,
    "group" "MilestoneGroup" NOT NULL,
    "level" INTEGER NOT NULL,
    "coachId" TEXT,
    "withCertificate" BOOLEAN NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneLevelCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MilestoneItem_group_level_idx" ON "MilestoneItem"("group", "level");

-- CreateIndex
CREATE INDEX "MilestoneItem_dependentId_idx" ON "MilestoneItem"("dependentId");

-- CreateIndex
CREATE INDEX "MilestoneItem_proposalStatus_idx" ON "MilestoneItem"("proposalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneAchievement_dependentId_itemId_key" ON "MilestoneAchievement"("dependentId", "itemId");

-- CreateIndex
CREATE INDEX "MilestoneNote_coachId_dependentId_createdAt_idx" ON "MilestoneNote"("coachId", "dependentId", "createdAt");

-- CreateIndex
CREATE INDEX "MilestoneNote_dependentId_createdAt_idx" ON "MilestoneNote"("dependentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneLevelCompletion_dependentId_group_level_key" ON "MilestoneLevelCompletion"("dependentId", "group", "level");

-- AddForeignKey
ALTER TABLE "MilestoneItem" ADD CONSTRAINT "MilestoneItem_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneItem" ADD CONSTRAINT "MilestoneItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneAchievement" ADD CONSTRAINT "MilestoneAchievement_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneAchievement" ADD CONSTRAINT "MilestoneAchievement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MilestoneItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneAchievement" ADD CONSTRAINT "MilestoneAchievement_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneNote" ADD CONSTRAINT "MilestoneNote_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneNote" ADD CONSTRAINT "MilestoneNote_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneNote" ADD CONSTRAINT "MilestoneNote_focusItemId_fkey" FOREIGN KEY ("focusItemId") REFERENCES "MilestoneItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneLevelCompletion" ADD CONSTRAINT "MilestoneLevelCompletion_dependentId_fkey" FOREIGN KEY ("dependentId") REFERENCES "Dependent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneLevelCompletion" ADD CONSTRAINT "MilestoneLevelCompletion_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Butir standar SPH (draf 29 Sep, docs/designs/milestone-daftar-keterampilan-draf.md).
-- id tetap (std_<kelompok><level>_<nomor>) supaya mudah dilacak.
INSERT INTO "MilestoneItem" ("id", "group", "level", "sortOrder", "text") VALUES
    ('std_A1_1', 'A', 1, 1, 'Mau masuk ke air sambil digendong orang tua, tanpa menangis.'),
    ('std_A1_2', 'A', 1, 2, 'Mau dibasahi wajahnya dengan siraman air dari tangan.'),
    ('std_A1_3', 'A', 1, 3, 'Bermain menepuk-nepuk air dan menendang-nendang kaki sambil dipegang.'),
    ('std_A2_4', 'A', 2, 4, 'Meniup gelembung di permukaan air lewat mulut.'),
    ('std_A2_5', 'A', 2, 5, 'Mengapung telentang selama 5 detik dengan kepala ditopang orang tua.'),
    ('std_A2_6', 'A', 2, 6, 'Meraih mainan yang mengapung sambil dipegang di bagian perut.'),
    ('std_A3_7', 'A', 3, 7, 'Memasukkan wajah ke air selama 2–3 detik lalu mengangkatnya sendiri.'),
    ('std_A3_8', 'A', 3, 8, 'Berpegangan sendiri di dinding kolam selama 5 detik (orang tua di sebelahnya).'),
    ('std_A3_9', 'A', 3, 9, 'Berpindah dari orang tua ke coach di dalam air dengan tenang.'),
    ('std_B1_1', 'B', 1, 1, 'Masuk dan keluar kolam lewat tangga atau tepi kolam dengan aman.'),
    ('std_B1_2', 'B', 1, 2, 'Membenamkan seluruh wajah ke air selama 3 detik.'),
    ('std_B1_3', 'B', 1, 3, 'Meniup gelembung di dalam air sambil wajah terbenam.'),
    ('std_B2_4', 'B', 2, 4, 'Mengapung telungkup dengan bantuan pelampung lengan atau papan pelampung.'),
    ('std_B2_5', 'B', 2, 5, 'Mengapung telentang dengan bantuan coach selama 5 detik.'),
    ('std_B2_6', 'B', 2, 6, 'Mendorong kaki dari dinding kolam lalu meluncur sejauh 2 meter.'),
    ('std_B3_7', 'B', 3, 7, 'Menendang kaki sambil berpegangan papan pelampung sejauh 5 meter.'),
    ('std_B3_8', 'B', 3, 8, 'Mengapung telungkup tanpa alat bantu selama 5 detik.'),
    ('std_B3_9', 'B', 3, 9, 'Bergerak maju 5 meter tanpa alat bantu (gaya apa saja).'),
    ('std_C1_1', 'C', 1, 1, 'Mengapung telungkup dan telentang tanpa alat bantu, masing-masing 10 detik.'),
    ('std_C1_2', 'C', 1, 2, 'Meluncur dari dinding kolam sejauh 3 meter dengan badan lurus.'),
    ('std_C1_3', 'C', 1, 3, 'Menendang kaki sambil berpegangan papan pelampung sejauh 10 meter.'),
    ('std_C2_4', 'C', 2, 4, 'Mengambil napas ke samping (menoleh) tanpa berhenti bergerak.'),
    ('std_C2_5', 'C', 2, 5, 'Berenang gaya bebas sejauh 12,5 meter (setengah panjang kolam 25 m).'),
    ('std_C2_6', 'C', 2, 6, 'Berenang gaya punggung sejauh 12,5 meter.'),
    ('std_C3_7', 'C', 3, 7, 'Berenang gaya bebas sejauh 25 meter tanpa berhenti.'),
    ('std_C3_8', 'C', 3, 8, 'Berenang gaya punggung sejauh 25 meter tanpa berhenti.'),
    ('std_C3_9', 'C', 3, 9, 'Berenang gaya dada sejauh 12,5 meter.'),
    ('std_C4_10', 'C', 4, 10, 'Berenang gaya dada sejauh 25 meter.'),
    ('std_C4_11', 'C', 4, 11, 'Mengapung tegak di tempat (kaki dan tangan terus bergerak) selama 30 detik.'),
    ('std_C4_12', 'C', 4, 12, 'Melompat masuk ke air dari tepi kolam lalu berenang kembali ke tepi.'),
    ('std_C4_13', 'C', 4, 13, 'Saat lelah di tengah kolam, bisa berhenti, mengapung telentang, dan melambaikan tangan minta tolong.'),
    ('std_D1_1', 'D', 1, 1, 'Membenamkan wajah dan mengembuskan napas lewat hidung di dalam air.'),
    ('std_D1_2', 'D', 1, 2, 'Mengapung telungkup dan telentang tanpa alat bantu, masing-masing 10 detik.'),
    ('std_D1_3', 'D', 1, 3, 'Meluncur dari dinding kolam sejauh 3 meter.'),
    ('std_D2_4', 'D', 2, 4, 'Menendang kaki sambil berpegangan papan pelampung sejauh 25 meter.'),
    ('std_D2_5', 'D', 2, 5, 'Berenang gaya bebas dengan napas ke samping sejauh 25 meter.'),
    ('std_D2_6', 'D', 2, 6, 'Berenang gaya punggung sejauh 25 meter.'),
    ('std_D3_7', 'D', 3, 7, 'Berenang gaya dada sejauh 25 meter.'),
    ('std_D3_8', 'D', 3, 8, 'Berenang gaya bebas 50 meter tanpa berhenti.'),
    ('std_D3_9', 'D', 3, 9, 'Mengapung tegak di tempat selama 60 detik.');
