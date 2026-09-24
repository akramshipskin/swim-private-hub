// Tanggal "Terakhir diperbarui" dokumen hukum. Satu sumber: halaman dokumen
// menampilkannya, dan pendaftaran mencatatnya sebagai versi yang disetujui
// (User.termsVersion). Ubah dokumen = ubah tanggal di sini.
export const TERMS_UPDATED_AT = "10 September 2026";
export const PRIVACY_UPDATED_AT = "10 September 2026";

export const LEGAL_CONSENT_VERSION = `S&K ${TERMS_UPDATED_AT}; Privasi ${PRIVACY_UPDATED_AT}`;

// Data persetujuan yang disimpan saat pendaftaran mandiri. Server menolak
// pendaftaran tanpa centang persetujuan (checkbox di browser bisa dilewati
// dengan request langsung).
export function consentData(acceptedTerms: unknown) {
  if (acceptedTerms !== true) return null;
  return { termsAcceptedAt: new Date(), termsVersion: LEGAL_CONSENT_VERSION };
}

export const CONSENT_REQUIRED_ERROR = "Setujui Syarat & Ketentuan dan Kebijakan Privasi dulu";
