// Model harga-dari-coach (keputusan Hadi 2 Okt 2026, docs/designs/harga-dari-coach.md).
// Kolam memasang harga tiket paket 4/8 sesi, coach memasang harga jasa paket
// 4/8 sesi; member bayar keduanya + biaya layanan SPH (persen di ATAS harga).
// Semua angka di sini dihitung server; browser tidak pernah dipercaya.
import { NO_SHOW_COACH_SHARE_PERCENT } from "@/lib/policy";

export const PACK_SIZES = [4, 8] as const;
export type PackSize = (typeof PACK_SIZES)[number];

// 4 sesi = 2 bulan, 8 sesi = 3 bulan, sesi coba 7 hari (Hadi 2 Okt).
export const PACK_DURATION_DAYS: Record<PackSize, number> = { 4: 60, 8: 90 };
export const TRIAL_DURATION_DAYS = 7;
// Jatah batal mandiri (Hadi 2 Okt): paket 4 = 2x, paket 8 = 4x. Sesi coba
// tidak bisa dibatalkan sendiri (tidak hadir = hangus), hanya lewat admin.
export const PACK_CANCEL_QUOTA: Record<PackSize, number> = { 4: 2, 8: 4 };
export const TRIAL_CANCEL_QUOTA = 0;

// Biaya layanan SPH dalam basis poin (650 = 6,5%). Dikunci di bawah 7% supaya
// kalimat "biaya layanan 6,5% (maksimal 7%)" selalu benar.
export const DEFAULT_SERVICE_FEE_BPS = 650;
export const MAX_SERVICE_FEE_BPS = 690;
// PPh 0,5% (PMK 37/2025) dari bagian kolam/coach, kecuali yang sudah
// menyerahkan surat pernyataan omzet < Rp500 juta.
export const PPH_WITHHOLD_BPS = 50;

export const MAX_PACK_PRICE = 50_000_000;
// Harga paket yang baru dipasang wajib kelipatan ini (Hadi 2 Okt malam, #8).
export const PRICE_STEP = 1_000;

export function isValidPackPrice(n: number) {
  return Number.isInteger(n) && n >= 1 && n <= MAX_PACK_PRICE;
}

export function isValidServiceFeeBps(n: number) {
  return Number.isInteger(n) && n >= 0 && n <= MAX_SERVICE_FEE_BPS;
}

// "6,5%" untuk tampilan.
export function formatBps(bps: number) {
  return `${(bps / 100).toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
}

type PackPrices = { pricePack4: number | null; pricePack8: number | null };

export type Quote = {
  totalSesi: number;
  poolPrice: number;
  coachPrice: number;
  serviceFee: number;
  total: number;
  durationDays: number;
  jatahCancel: number;
  isTrial: boolean;
};

function build(totalSesi: number, poolPrice: number, coachPrice: number, feeBps: number, isTrial: boolean): Quote {
  const serviceFee = Math.round(((poolPrice + coachPrice) * feeBps) / 10_000);
  return {
    totalSesi,
    poolPrice,
    coachPrice,
    serviceFee,
    total: poolPrice + coachPrice + serviceFee,
    durationDays: isTrial ? TRIAL_DURATION_DAYS : PACK_DURATION_DAYS[totalSesi as PackSize],
    jatahCancel: isTrial ? TRIAL_CANCEL_QUOTA : PACK_CANCEL_QUOTA[totalSesi as PackSize],
    isTrial,
  };
}

// Harga paket 4/8 sesi untuk kombinasi kolam + coach. null = salah satu belum
// memasang harga untuk ukuran itu.
export function packQuote(pool: PackPrices & { serviceFeeBps: number }, coach: PackPrices, size: PackSize): Quote | null {
  const p = size === 4 ? pool.pricePack4 : pool.pricePack8;
  const c = size === 4 ? coach.pricePack4 : coach.pricePack8;
  if (p == null || c == null || !isValidPackPrice(p) || !isValidPackPrice(c)) return null;
  return build(size, p, c, pool.serviceFeeBps, false);
}

// Paket termurah di sebuah kolam di antara semua coach yang mengajar di sana
// dan sudah memasang harga (dipakai kartu kolam di landing: "4 sesi mulai Rp...").
export function cheapestPackQuote(
  pool: PackPrices & { serviceFeeBps: number },
  coaches: PackPrices[],
): { total: number; sessions: number } | null {
  const quotes = coaches
    .flatMap((c) => PACK_SIZES.map((n) => packQuote(pool, c, n)))
    .filter((q): q is Quote => q != null);
  if (!quotes.length) return null;
  const cheapest = quotes.reduce((a, b) => (b.total < a.total ? b : a));
  return { total: cheapest.total, sessions: cheapest.totalSesi };
}

// Sesi coba (Hadi 2 Okt): harga per sesi paket 4 kolam + coach, + biaya layanan, tanpa diskon.
export function trialQuote(pool: PackPrices & { serviceFeeBps: number }, coach: PackPrices): Quote | null {
  const four = packQuote(pool, coach, 4);
  if (!four) return null;
  return build(1, Math.floor(four.poolPrice / 4), Math.floor(four.coachPrice / 4), pool.serviceFeeBps, true);
}

// Hemat per sesi paket 8 dibanding paket 4 (persen bulat ke bawah); 0 = tidak lebih murah.
export function pack8SavingPercent(four: Quote, eight: Quote) {
  const per4 = four.total / 4;
  const per8 = eight.total / 8;
  return per8 < per4 ? Math.floor(((per4 - per8) / per4) * 100) : 0;
}

// Pembagian 1 sesi paket model baru. Nilai sesi = floor(bayar / totalSesi)
// (sama dengan model lama); kolam & coach dapat floor(harga mereka /
// totalSesi), sisanya (biaya layanan + pembulatan bagian kolam/coach) dicatat
// sebagai bagian SPH per sesi. Tidak hadir (sudah booking): kolam 0, coach 50%
// bagiannya, sisanya SPH.
// Sisa `bayar mod totalSesi` (maks Rp3 paket 4, Rp7 paket 8) tidak masuk sesi
// mana pun: uangnya tetap di rekening SPH sebagai pendapatan SPH (Hadi 2 Okt,
// MATH-002), tetapi tidak dibuat baris buku besar terpisah, sama seperti nilai
// sesi yang hangus. Akuntan membacanya dari selisih uang masuk vs bagi hasil.
export function sessionSplit({
  paid,
  totalSesi,
  poolPrice,
  coachPrice,
  attended,
}: {
  paid: number;
  totalSesi: number;
  poolPrice: number;
  coachPrice: number;
  attended: boolean;
}) {
  const value = Math.floor(paid / totalSesi);
  let coach = Math.floor(coachPrice / totalSesi);
  let pool = attended ? Math.floor(poolPrice / totalSesi) : 0;
  if (!attended) coach = Math.floor((coach * NO_SHOW_COACH_SHARE_PERCENT) / 100);
  // Jaga-jaga bila yang dibayar kurang dari harga tersimpan: kolam/coach tidak
  // pernah dikredit melebihi nilai sesi.
  coach = Math.min(coach, value);
  pool = Math.min(pool, value - coach);
  return { value, pool, coach, platform: value - pool - coach };
}

export function pphAmount(gross: number, exempt: boolean) {
  return exempt || gross <= 0 ? 0 : Math.round((gross * PPH_WITHHOLD_BPS) / 10_000);
}

// Isian form harga paket (coach/kolam/admin). Kosong = tidak menjual ukuran itu.
// current = harga yang tersimpan di database sekarang (bukan dari form: isian
// tersembunyi bisa dipalsukan); harga yang sama dengan itu boleh bukan kelipatan.
export function parsePackPrices(
  formData: FormData,
  current: { pricePack4: number | null; pricePack8: number | null } | null,
): { pricePack4: number | null; pricePack8: number | null } | { error: string } {
  const read = (key: string) => {
    const raw = formData.get(key)?.toString().trim() ?? "";
    return raw === "" ? null : Number(raw);
  };
  const pricePack4 = read("pricePack4");
  const pricePack8 = read("pricePack8");
  for (const v of [pricePack4, pricePack8]) {
    if (v !== null && !isValidPackPrice(v)) return { error: "Harga harus angka bulat Rp 1 sampai Rp 50.000.000, atau dikosongkan." };
  }
  // Harga baru wajib kelipatan Rp1.000 (Hadi 2 Okt malam, #8); harga lama yang
  // tidak diubah (sama dengan yang tersimpan) tetap diterima.
  for (const [v, o] of [[pricePack4, current?.pricePack4 ?? null], [pricePack8, current?.pricePack8 ?? null]] as const) {
    if (v !== null && v !== o && v % PRICE_STEP !== 0) return { error: "Harga harus kelipatan Rp 1.000, contoh Rp 260.000." };
  }
  return { pricePack4, pricePack8 };
}

// Hanya harga yang diubah di form (beda dari harga saat halaman dibuka) yang
// ditulis -- form admin dipakai bersamaan dengan coach/pemilik kolam.
export function changedPackPrices(
  formData: FormData,
  prices: { pricePack4: number | null; pricePack8: number | null }
): Partial<{ pricePack4: number | null; pricePack8: number | null }> {
  const orig = (key: string) => {
    const raw = formData.get(key)?.toString() ?? "";
    return raw === "" ? null : Number(raw);
  };
  return {
    ...(prices.pricePack4 !== orig("origPack4") ? { pricePack4: prices.pricePack4 } : {}),
    ...(prices.pricePack8 !== orig("origPack8") ? { pricePack8: prices.pricePack8 } : {}),
  };
}

// Harga paket saat daftar coach/kolam (Hadi 3 Okt): minimal satu ukuran diisi,
// kelipatan Rp1.000. Isian JSON boleh angka atau teks angka; kosong = tidak
// menjual ukuran itu.
export function parseRegisterPrices(
  raw4: unknown,
  raw8: unknown,
): { pricePack4: number | null; pricePack8: number | null } | { error: string } {
  const read = (v: unknown) => (v == null || v === "" ? null : typeof v === "number" || typeof v === "string" ? Number(v) : NaN);
  const pricePack4 = read(raw4);
  const pricePack8 = read(raw8);
  if (pricePack4 === null && pricePack8 === null) return { error: "Isi harga paket 4 sesi atau 8 sesi (boleh keduanya)." };
  for (const v of [pricePack4, pricePack8]) {
    if (v === null) continue;
    if (!isValidPackPrice(v)) return { error: "Harga harus angka bulat Rp 1.000 sampai Rp 50.000.000." };
    if (v % PRICE_STEP !== 0) return { error: "Harga harus kelipatan Rp 1.000, contoh Rp 260.000." };
  }
  return { pricePack4, pricePack8 };
}

// Kapasitas harian kolam khusus pelanggan SPH (Hadi 3 Okt): 1-500 sesi per hari.
export const MAX_DAILY_CAPACITY = 500;
export function parseDailyCapacity(v: unknown): number | { error: string } {
  const n = typeof v === "number" || typeof v === "string" ? Number(v) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > MAX_DAILY_CAPACITY) {
    return { error: `Kapasitas harian harus angka bulat 1 sampai ${MAX_DAILY_CAPACITY} sesi.` };
  }
  return n;
}
