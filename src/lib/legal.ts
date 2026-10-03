// Tanggal "Terakhir diperbarui" dokumen hukum. Satu sumber: halaman dokumen
// menampilkannya, dan pendaftaran mencatatnya sebagai versi yang disetujui
// (User.termsVersion). Ubah dokumen = ubah tanggal di sini.
export const TERMS_UPDATED_AT = "3 Oktober 2026";
// S&K diubah beberapa kali di tanggal yang sama (29 Sep: pasal 3, S&K v2
// yang disetujui reviewer hukum, batas tanggung jawab 100%, lalu pasal
// afiliasi & trial). Nomor revisi membedakan keduanya di catatan
// persetujuan; naikkan kalau S&K diubah lagi di hari yang sama.
// 3 Okt 2026: kota, coach memilih kolam, syarat tampil coach, penggantian coach
// tanpa biaya (rev.3 disetujui orang hukum); nomor revisi kembali ke 1.
export const TERMS_REVISION = 1;
// 30 Sep 2026: menambah tanggal lahir peserta, catatan & sertifikat milestone,
// kode afiliasi, data coach (tanggal lahir, tanda tangan), bagian data anak,
// kunci login per akun. Teks ini belum ditinjau orang hukum.
// 2 Okt 2026: riwayat Saldo Member, alasan ganti coach, surat pernyataan omzet
// (PPh); disetujui orang hukum bersama draf harga-dari-coach v3. Lalu Meta
// Pixel + Conversions API (Hadi 2 Okt, 5B: orang hukum setuju tanpa menunggu
// persetujuan cookie).
export const PRIVACY_UPDATED_AT = "2 Oktober 2026";

export const LEGAL_CONSENT_VERSION = `S&K ${TERMS_UPDATED_AT} rev ${TERMS_REVISION}; Privasi ${PRIVACY_UPDATED_AT}`;

// Data persetujuan yang disimpan saat pendaftaran mandiri. Server menolak
// pendaftaran tanpa centang persetujuan (checkbox di browser bisa dilewati
// dengan request langsung).
export function consentData(acceptedTerms: unknown) {
  if (acceptedTerms !== true) return null;
  return { termsAcceptedAt: new Date(), termsVersion: LEGAL_CONSENT_VERSION };
}

export const CONSENT_REQUIRED_ERROR = "Setujui Syarat & Ketentuan dan Kebijakan Privasi dulu";

// Pendaftaran coach/kolam: centang yang sama juga menyetujui perjanjian/MOU mitra.
export const PARTNER_CONSENT_REQUIRED_ERROR = {
  COACH: "Setujui Syarat & Ketentuan, Kebijakan Privasi, dan Perjanjian Kemitraan Coach dulu",
  POOL_OWNER: "Setujui Syarat & Ketentuan, Kebijakan Privasi, dan MOU Kolam Mitra dulu",
} as const;
