// Umur & jenis kelamin coach: dipakai di profil publik, cari coach, halaman
// kolam, dan detail user admin. Umur SELALU dihitung dari tanggal lahir
// supaya tidak basi, jangan pernah disimpan sebagai angka.
export const GENDER_LABEL = { MALE: "Laki-laki", FEMALE: "Perempuan" } as const;

export type Gender = keyof typeof GENDER_LABEL;

export function ageFromBirthDate(birthDate: Date | string | null | undefined, now: Date = new Date()): number | null {
  if (!birthDate) return null;
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(d.getTime())) return null;
  // Tanggal lahir tersimpan sebagai tanggal (tengah malam UTC); "hari ini"
  // dihitung di WIB. Dulu pakai zona waktu server -- di Vercel (UTC) umur baru
  // bertambah jam 07.00 WIB di hari ulang tahunnya.
  // Tanggal lahir juga dibaca di WIB: coach disimpan tengah malam WIB (=17.00
  // UTC hari sebelumnya), peserta tengah malam UTC; +7 jam menghasilkan
  // tanggal yang benar untuk keduanya (dulu coach bertambah umur sehari lebih awal).
  const today = new Date(now.getTime() + 7 * 3600e3);
  const born = new Date(d.getTime() + 7 * 3600e3);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const beforeBirthdayThisYear =
    today.getUTCMonth() < born.getUTCMonth() ||
    (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

// Baris ringkas "28 tahun · Perempuan" -- bagian yang kosong dilewati,
// jadi aman dipakai walau coach belum mengisi salah satunya.
export function coachBioLine(
  profile: { birthDate?: Date | string | null; gender?: Gender | null } | null | undefined,
  now?: Date,
): string | null {
  const age = ageFromBirthDate(profile?.birthDate, now);
  const parts = [age !== null ? `${age} tahun` : null, profile?.gender ? GENDER_LABEL[profile.gender] : null].filter(
    Boolean,
  );
  return parts.length ? parts.join(" · ") : null;
}
