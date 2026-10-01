// Kapitalisasi huruf depan tiap kata doang -- sengaja gak nge-lowercase
// sisanya, biar gak ngerusak nama yang emang sengaja ada huruf besar di
// tengah (misal "TTT", akronim, dst).
export function toProperCase(input: string): string {
  return input
    .split(" ")
    .map((word) => (word.length ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// Nomor HP Indonesia: awalan 0/62/+62, diikuti 8, lalu 1-9, lalu 6-10 digit
// lagi -- nutupin panjang wajar nomor seluler (10-13 digit total) tanpa
// nolak variasi awalan yang umum dipake orang pas ngetik manual.
export function isValidIndonesianPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(digits);
}

// Bentuk baku nomor HP yang disimpan: 08xxxxxxxxxx. "+62 812-3456-7890",
// "6281234567890", "0812 3456 7890" -> "081234567890". Input yang bukan nomor
// HP Indonesia valid dikembalikan apa adanya (hanya di-trim), jadi pemanggil
// tetap wajib validasi dulu.
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const compact = trimmed.replace(/[\s\-().]/g, "");
  if (!isValidIndonesianPhone(compact)) return trimmed;
  return compact.replace(/^(\+62|62)/, "0");
}

// Bentuk-bentuk lama yang mungkin sudah tersimpan untuk nomor yang sama
// (data sebelum pembakuan 25 Sep 2026): cari pakai semuanya supaya akun
// lama tetap bisa login dan tidak bisa didaftarkan ulang.
export function phoneVariants(phone: string): string[] {
  const p = normalizePhone(phone);
  if (!p.startsWith("08")) return [p];
  const rest = p.slice(1);
  return [p, `62${rest}`, `+62${rest}`];
}

// Email disimpan huruf kecil semua; string kosong = tidak ada email.
export function normalizeEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return e ? e : null;
}

// Kondisi "HP atau email ini sudah dipakai akun lain" (Prisma where) --
// email dicocokkan tanpa beda huruf besar/kecil untuk data lama.
export function identityTakenWhere(phone: string, email: string | null) {
  return {
    OR: [
      { phone: { in: phoneVariants(phone) } },
      ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []),
    ],
  };
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// Angka dari form. Kosong / tidak terkirim = NaN (bukan 0): Number("") = 0,
// jadi tanpa ini kolom yang dikosongkan tersimpan diam-diam sebagai 0
// (sisa sesi 0, komisi 0%). Pemanggil tetap memvalidasi rentangnya.
export function formNumber(formData: FormData, key: string): number {
  const raw = formData.get(key);
  return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
}
