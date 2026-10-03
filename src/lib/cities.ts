// Kota layanan SPH (Hadi 3 Okt). Kota dan kabupaten digabung (Bogor = Kota +
// Kabupaten Bogor, dst). Disimpan sebagai teks di User.city & Pool.city;
// semua isian dicek ke daftar ini di server.
export const CITIES = [
  "Jakarta",
  "Depok",
  "Bekasi",
  "Bogor",
  "Tangerang",
  "Bandung",
  "Cianjur",
  "Sukabumi",
  "Surabaya",
  "Malang",
] as const;
export type City = (typeof CITIES)[number];

export function isCity(v: unknown): v is City {
  return typeof v === "string" && (CITIES as readonly string[]).includes(v);
}

// Saran kota terdekat saat kota member belum punya kolam & coach (Hadi 3 Okt,
// daftar tunggu). Urutan = paling dekat dulu.
export const NEARBY_CITIES: Record<City, readonly City[]> = {
  Jakarta: ["Depok", "Tangerang", "Bekasi", "Bogor"],
  Depok: ["Jakarta", "Bogor"],
  Bekasi: ["Jakarta", "Depok"],
  Bogor: ["Depok", "Jakarta", "Cianjur", "Sukabumi"],
  Tangerang: ["Jakarta"],
  Bandung: ["Cianjur"],
  Cianjur: ["Bogor", "Sukabumi", "Bandung"],
  Sukabumi: ["Bogor", "Cianjur"],
  Surabaya: ["Malang"],
  Malang: ["Surabaya"],
};

export const OTHER_CITY_WARNING = {
  COACH: "Kolam ini di luar kota domisili kamu. Pastikan kamu sanggup datang ke sana setiap jadwal.",
  MEMBER: "Kolam di kota ini di luar kota domisili kamu. Pastikan lokasinya terjangkau sebelum membeli paket.",
} as const;
