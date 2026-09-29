// Sertifikat coach (tabel CoachCertificate, bisa banyak per coach).
// Badge "Bersertifikat" tampil kalau coach punya >=1 sertifikat APPROVED.

// Batas biar fitur unggah tidak dipakai buat menimbun file (Hadi 29 Sep).
export const MAX_CERTIFICATES_PER_COACH = 10;

// Pilihan relasi Prisma: nama sertifikat yang sudah disetujui, urut unggahan
// paling lama -> sertifikat pertama yang disetujui jadi nama utama di badge.
export const approvedCertificatesSelect = {
  where: { status: "APPROVED" },
  select: { name: true },
  orderBy: { createdAt: "asc" },
} as const;

// "Bersertifikat · FASI" / "Bersertifikat · FASI +2"; null kalau belum ada
// yang disetujui (badge tidak tampil).
export function certifiedBadgeText(approved: { name: string }[] | undefined | null): string | null {
  if (!approved || approved.length === 0) return null;
  const extra = approved.length > 1 ? ` +${approved.length - 1}` : "";
  return `Bersertifikat · ${approved[0].name}${extra}`;
}

// Label & warna badge status per sertifikat (Profil coach, detail user admin).
export const certificateStatusBadge = {
  NONE: { label: "Belum ada", tone: "neutral" },
  PENDING: { label: "Menunggu persetujuan", tone: "warning" },
  APPROVED: { label: "Disetujui", tone: "success" },
  REJECTED: { label: "Ditolak", tone: "danger" },
} as const;
