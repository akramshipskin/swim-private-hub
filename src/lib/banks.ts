// Daftar bank untuk dropdown rekening pencairan (coach & kolam). Yang disimpan
// di kolom bankName = LABEL (dibaca admin saat transfer manual). `code` = kode
// bank Midtrans Payouts (huruf kecil, peka huruf besar/kecil) untuk pencairan
// otomatis nanti -- dari docs.midtrans.com/reference/list-of-supported-banks
// (dibaca 24 Sep 2026), BELUM diuji lewat API karena Payouts belum aktif.
export const BANKS = [
  { label: "BCA", code: "bca" },
  { label: "BRI", code: "bri" },
  { label: "BNI", code: "bni" },
  { label: "Mandiri", code: "mandiri" },
  { label: "BSI (Bank Syariah Indonesia)", code: "bsi" },
  { label: "CIMB Niaga", code: "cimb" },
  { label: "Permata", code: "permata" },
  { label: "Danamon", code: "danamon" },
  { label: "BTN", code: "btn" },
  { label: "OCBC", code: "ocbc" },
  { label: "Panin", code: "panin" },
  { label: "Maybank", code: "maybank" },
  { label: "Mega", code: "mega_tbk" },
  { label: "SMBC Indonesia (ex BTPN)", code: "btpn" },
  { label: "Jago", code: "jago" },
  { label: "SeaBank", code: "seabank" },
  { label: "blu by BCA Digital", code: "bcad" },
  { label: "Allo Bank", code: "allo" },
  { label: "Bank Neo Commerce", code: "yudha_bhakti" },
  { label: "Muamalat", code: "muamalat" },
  { label: "BCA Syariah", code: "bca_syar" },
  { label: "KB Bukopin", code: "bukopin" },
  { label: "Sinarmas", code: "sinarmas" },
  { label: "Mayapada", code: "mayapada" },
  { label: "Nobu", code: "nobu" },
  { label: "UOB", code: "uob" },
  { label: "DBS", code: "dbs" },
  { label: "HSBC", code: "hsbc" },
  { label: "BJB", code: "bjb" },
  { label: "Bank DKI", code: "dki" },
  { label: "Bank Jateng", code: "jateng" },
  { label: "Bank Jatim", code: "jatim" },
  { label: "Bank DIY", code: "diy" },
  { label: "Bank Bali", code: "bali" },
  { label: "Bank Sumut", code: "sumut" },
  { label: "Bank Nagari", code: "nagari" },
  { label: "Bank Riau Kepri", code: "riau" },
  { label: "Bank Lampung", code: "lampung" },
  { label: "Bank Kalbar", code: "kalbar" },
  { label: "Bank Kalsel", code: "kalsel" },
  { label: "Bank Kaltim", code: "kaltim" },
  { label: "Bank Sulselbar", code: "sulselbar" },
] as const;

export const BANK_LABELS: readonly string[] = BANKS.map((b) => b.label);

export function bankCode(label: string): string | undefined {
  return BANKS.find((b) => b.label === label)?.code;
}

const norm = (s: string) => s.toLowerCase().replace(/^bank\s+/, "").replace(/[^a-z0-9]/g, "");

// Nama bank lama yang diketik bebas ("bca", "Bank BCA", "BANK MANDIRI") -> label
// di daftar, supaya rekening yang sudah tersimpan tetap terpilih di dropdown.
// Sengaja HANYA cocok persis (setelah dibersihkan): tebakan yang meleset bisa
// mengarahkan transfer ke bank yang salah ("BCA Syariah" bukan "BCA"). Yang
// tidak cocok dikembalikan null dan pemiliknya diminta memilih ulang.
export function matchBankLabel(saved: string | null | undefined): string | null {
  if (!saved) return null;
  const n = norm(saved);
  if (!n) return null;
  return BANKS.find((b) => norm(b.label) === n || b.code === n)?.label ?? null;
}

// Pesan error (string) atau null kalau bank valid untuk disimpan.
export function validateBankName(bankName: string): string | null {
  return BANK_LABELS.includes(bankName) ? null : "Pilih nama bank dari daftar.";
}
