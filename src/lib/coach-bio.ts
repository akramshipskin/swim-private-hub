// Umur & jenis kelamin coach: dipakai di profil publik, cari coach, halaman
// kolam, dan detail user admin. Umur SELALU dihitung dari tanggal lahir
// supaya tidak basi, jangan pernah disimpan sebagai angka.
export const GENDER_LABEL = { MALE: "Laki-laki", FEMALE: "Perempuan" } as const;

export type Gender = keyof typeof GENDER_LABEL;

export function ageFromBirthDate(birthDate: Date | string | null | undefined, now: Date = new Date()): number | null {
  if (!birthDate) return null;
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(d.getTime())) return null;
  let age = now.getFullYear() - d.getFullYear();
  const beforeBirthdayThisYear =
    now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
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
