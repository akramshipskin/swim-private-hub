// Daftar tetap (bukan free-text) biar scan-able di halaman shortcut coach
// (/pelatih/[id]) & gampang di-render sebagai checkbox pas daftar.
export const COACH_SPECIALTIES = [
  "Gaya bebas",
  "Gaya dada",
  "Gaya punggung",
  "Gaya kupu-kupu",
  "Renang bayi & balita",
  "Renang anak usia dini",
  "Terapi air",
  "Persiapan kompetisi/atlet",
] as const;

export type CoachSpecialty = (typeof COACH_SPECIALTIES)[number];
